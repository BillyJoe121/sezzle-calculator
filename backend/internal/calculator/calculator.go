// Package calculator is the pure arithmetic domain: the operation registry, evaluation and result
// normalization. It knows nothing about HTTP.
package calculator

import (
	"errors"
	"fmt"
	"math"
	"slices"
)

// Operation identifies one registered arithmetic operation. Ids are case-sensitive.
type Operation string

// The operations defined by the API contract.
const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	Sqrt       Operation = "sqrt"
	Percentage Operation = "percentage"
)

// Sentinel errors returned by Arity and Calculate. Callers check them with errors.Is.
var (
	ErrUnsupportedOperation = errors.New("unsupported operation")
	ErrInvalidOperandCount  = errors.New("invalid operand count")
	ErrDivisionByZero       = errors.New("division by zero")
	ErrDomain               = errors.New("operation undefined for operands")
	ErrOutOfRange           = errors.New("result out of float64 range")
)

// strategy is one registered operation: how many operands it takes and how to evaluate them.
type strategy struct {
	arity int
	eval  func(operands []float64) (float64, error)
}

// order is the contract order reported by Operations.
var order = []Operation{Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage}

var registry = map[Operation]strategy{
	Add:      {2, func(o []float64) (float64, error) { return o[0] + o[1], nil }},
	Subtract: {2, func(o []float64) (float64, error) { return o[0] - o[1], nil }},
	Multiply: {2, func(o []float64) (float64, error) { return o[0] * o[1], nil }},
	Divide:   {2, divide},
	Power:    {2, power},
	Sqrt:     {1, func(o []float64) (float64, error) { return math.Sqrt(o[0]), nil }},
	Percentage: {2, func(o []float64) (float64, error) {
		if r := o[0] * o[1] / 100; !math.IsInf(r, 0) {
			return r, nil
		}
		// The product overflowed; scaling first keeps a representable result finite.
		return o[0] / 100 * o[1], nil
	}},
}

// divide rejects a zero divisor (0 or -0) before dividing, so 0/0 is also a division by zero.
func divide(o []float64) (float64, error) {
	if o[1] == 0 {
		return 0, ErrDivisionByZero
	}
	return o[0] / o[1], nil
}

// power rejects zero to a negative exponent before calling math.Pow, which would return +Inf.
func power(o []float64) (float64, error) {
	if o[0] == 0 && o[1] < 0 {
		return 0, ErrDomain
	}
	return math.Pow(o[0], o[1]), nil
}

// Operations returns every supported operation in contract order. The slice is a copy.
func Operations() []Operation {
	return slices.Clone(order)
}

// Arity returns how many operands op takes, or ErrUnsupportedOperation.
func Arity(op Operation) (int, error) {
	s, ok := registry[op]
	if !ok {
		return 0, fmt.Errorf("%w: %q", ErrUnsupportedOperation, op)
	}
	return s.arity, nil
}

// Calculate evaluates op over operands. The result is always finite and never -0; otherwise one of the
// sentinel errors is returned.
func Calculate(op Operation, operands []float64) (float64, error) {
	s, ok := registry[op]
	if !ok {
		return 0, fmt.Errorf("%w: %q", ErrUnsupportedOperation, op)
	}
	if len(operands) != s.arity {
		return 0, fmt.Errorf("%w: %s takes %d, got %d", ErrInvalidOperandCount, op, s.arity, len(operands))
	}
	result, err := s.eval(operands)
	if err != nil {
		return 0, err
	}
	return normalize(result)
}

// normalize is the single exit check: NaN is a domain error, ±Inf is out of range and -0 becomes 0.
func normalize(result float64) (float64, error) {
	switch {
	case math.IsNaN(result):
		return 0, ErrDomain
	case math.IsInf(result, 0):
		return 0, ErrOutOfRange
	}
	return result + 0, nil // -0 + 0 is +0 in round-to-nearest
}
