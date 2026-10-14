package httpapi

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/BillyJoe121/sezzle-calculator/backend/internal/calculator"
)

type calculationResponse struct {
	Operation calculator.Operation `json:"operation"`
	Operands  []float64            `json:"operands"`
	Result    float64              `json:"result"`
}

type api struct {
	logger *slog.Logger
}

func (a *api) calculate(w http.ResponseWriter, r *http.Request) {
	req, err := decodeRequest(w, r)
	if err != nil {
		writeError(w, a.logger, err)
		return
	}
	result, err := calculator.Calculate(req.operation, req.operands)
	if err != nil {
		writeError(w, a.logger, err)
		return
	}
	operands := make([]float64, len(req.operands))
	for i, v := range req.operands {
		if v == 0 {
			v = 0 // normalize -0
		}
		operands[i] = v
	}
	writeJSON(w, http.StatusOK, "application/json", calculationResponse{req.operation, operands, result})
}

// writeError is the single place where errors become problem documents.
func writeError(w http.ResponseWriter, logger *slog.Logger, err error) {
	var p *problem
	switch {
	case errors.As(err, &p):
	case errors.Is(err, calculator.ErrUnsupportedOperation):
		p = newProblem(http.StatusBadRequest, "UNSUPPORTED_OPERATION", unsupportedOperationDetail())
	case errors.Is(err, calculator.ErrInvalidOperandCount):
		p = newProblem(http.StatusBadRequest, "INVALID_OPERANDS", "The number of operands does not match the operation.")
	case errors.Is(err, calculator.ErrDivisionByZero):
		p = newProblem(http.StatusUnprocessableEntity, "DIVISION_BY_ZERO", "Division by zero is undefined.")
	case errors.Is(err, calculator.ErrDomain):
		p = newProblem(http.StatusUnprocessableEntity, "DOMAIN_ERROR", "The operation is undefined for these operands.")
	case errors.Is(err, calculator.ErrOutOfRange):
		p = newProblem(http.StatusUnprocessableEntity, "RESULT_OUT_OF_RANGE",
			"The result is outside the range of a 64-bit floating-point number.")
	default:
		logger.Error("unexpected error", slog.Any("error", err))
		p = internalError()
	}
	writeProblem(w, p)
}

func unsupportedOperationDetail() string {
	ids := make([]string, 0, 7)
	for _, op := range calculator.Operations() {
		ids = append(ids, string(op))
	}
	return fmt.Sprintf("Unsupported operation. Supported operations: %s.", strings.Join(ids, ", "))
}
