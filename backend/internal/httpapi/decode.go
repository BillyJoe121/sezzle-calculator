package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"strings"

	"github.com/BillyJoe121/sezzle-calculator/backend/internal/calculator"
)

const maxBodyBytes = 4096

// calculationRequest is a fully validated request.
type calculationRequest struct {
	operation calculator.Operation
	operands  []float64
}

// decodeRequest validates in the contract order: Content-Type, size, JSON shape, operation, operands.
// Faults it detects itself are *problem values; other errors are the domain's and go through writeError.
func decodeRequest(w http.ResponseWriter, r *http.Request) (calculationRequest, error) {
	if !isJSONContentType(r.Header.Get("Content-Type")) {
		return calculationRequest{}, newProblem(http.StatusUnsupportedMediaType, "UNSUPPORTED_MEDIA_TYPE",
			"Content-Type must be application/json.")
	}

	// Read everything before parsing so an oversized body is always a 413, even when it is also malformed.
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		return calculationRequest{}, newProblem(http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE",
			fmt.Sprintf("Request body must not exceed %d bytes.", maxBodyBytes))
	}
	if err != nil {
		return calculationRequest{}, errInvalidJSON
	}

	operationRaw, operandsRaw, err := splitFields(body)
	if err != nil {
		return calculationRequest{}, err
	}

	var operation string // JSON null leaves it empty
	if operationRaw != nil && json.Unmarshal(operationRaw, &operation) != nil {
		return calculationRequest{}, errBadShape
	}
	var elements []json.RawMessage // JSON null leaves it nil
	if operandsRaw != nil && json.Unmarshal(operandsRaw, &elements) != nil {
		return calculationRequest{}, errBadShape
	}

	op := calculator.Operation(operation)
	arity, err := calculator.Arity(op)
	if err != nil {
		return calculationRequest{}, err
	}
	if len(elements) != arity {
		noun := "operands"
		if arity == 1 {
			noun = "operand"
		}
		return calculationRequest{}, newProblem(http.StatusBadRequest, "INVALID_OPERANDS",
			fmt.Sprintf("Operation %q requires exactly %d %s.", operation, arity, noun))
	}

	operands := make([]float64, len(elements))
	for i, element := range elements {
		var n *float64
		if json.Unmarshal(element, &n) != nil || n == nil {
			return calculationRequest{}, newProblem(http.StatusBadRequest, "INVALID_OPERANDS",
				"Operands must be finite JSON numbers.")
		}
		operands[i] = *n
	}
	return calculationRequest{operation: op, operands: operands}, nil
}

var (
	errInvalidJSON = newProblem(http.StatusBadRequest, "INVALID_JSON", "Request body is not valid JSON.")
	errBadShape    = newProblem(http.StatusBadRequest, "INVALID_JSON",
		`Request body must be a single JSON object with only the fields "operation" and "operands".`)
)

// splitFields parses body as exactly one JSON object whose keys are only "operation" and "operands".
// It decodes into a map because encoding/json matches struct fields case-insensitively.
func splitFields(body []byte) (operation, operands json.RawMessage, err error) {
	dec := json.NewDecoder(bytes.NewReader(body))
	var fields map[string]json.RawMessage
	if dec.Decode(&fields) != nil {
		return nil, nil, errInvalidJSON
	}
	if _, err := dec.Token(); !errors.Is(err, io.EOF) {
		return nil, nil, errInvalidJSON
	}
	if fields == nil { // the body was the literal null
		return nil, nil, errBadShape
	}
	for key := range fields {
		if key != "operation" && key != "operands" {
			return nil, nil, errBadShape
		}
	}
	return fields["operation"], fields["operands"], nil
}

// isJSONContentType accepts application/json whose only parameter, if any, is charset=utf-8.
func isJSONContentType(header string) bool {
	mediaType, params, err := mime.ParseMediaType(header)
	if err != nil || mediaType != "application/json" {
		return false
	}
	for name, value := range params {
		if name != "charset" || !strings.EqualFold(value, "utf-8") {
			return false
		}
	}
	return true
}
