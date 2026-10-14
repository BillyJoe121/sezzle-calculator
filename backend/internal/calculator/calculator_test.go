package calculator

import (
	"errors"
	"math"
	"slices"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct {
		name     string
		op       Operation
		operands []float64
		want     float64
	}{
		{"add two positives", Add, []float64{2, 3}, 5},
		{"add keeps float64 precision", Add, []float64{0.1, 0.2}, 0.30000000000000004},
		{"add negative operand", Add, []float64{-4, 1.5}, -2.5},
		{"subtract", Subtract, []float64{10, 4}, 6},
		{"subtract into negative", Subtract, []float64{1, 3}, -2},
		{"multiply", Multiply, []float64{6, 7}, 42},
		{"multiply by zero", Multiply, []float64{5, 0}, 0},
		{"divide", Divide, []float64{10, 4}, 2.5},
		{"divide zero by non-zero", Divide, []float64{0, 5}, 0},
		{"power integer exponent", Power, []float64{2, 10}, 1024},
		{"power negative base integer exponent", Power, []float64{-2, 3}, -8},
		{"power negative exponent", Power, []float64{2, -2}, 0.25},
		{"power fractional exponent", Power, []float64{9, 0.5}, 3},
		{"power zero to zero is one", Power, []float64{0, 0}, 1},
		{"power negative zero to zero is one", Power, []float64{math.Copysign(0, -1), 0}, 1},
		{"power zero to positive", Power, []float64{0, 3}, 0},
		{"sqrt perfect square", Sqrt, []float64{16}, 4},
		{"sqrt zero", Sqrt, []float64{0}, 0},
		{"percentage", Percentage, []float64{15, 200}, 30},
		{"percentage of zero", Percentage, []float64{50, 0}, 0},
		{"percentage falls back when the product overflows", Percentage, []float64{1e300, 1e10}, 1e308},
		{"percentage falls back with a negative product", Percentage, []float64{-1e300, 1e10}, -1e308},
		{"underflow to zero is valid", Multiply, []float64{1e-300, 1e-300}, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.operands)
			if err != nil {
				t.Fatalf("Calculate(%q, %v) error = %v, want nil", tt.op, tt.operands, err)
			}
			if got != tt.want {
				t.Errorf("Calculate(%q, %v) = %v, want %v", tt.op, tt.operands, got, tt.want)
			}
		})
	}
}

func TestCalculateNormalizesNegativeZero(t *testing.T) {
	negZero := math.Copysign(0, -1)
	tests := []struct {
		name     string
		op       Operation
		operands []float64
	}{
		{"multiply negative by zero", Multiply, []float64{-1, 0}},
		{"sqrt of negative zero", Sqrt, []float64{negZero}},
		{"add two negative zeros", Add, []float64{negZero, negZero}},
		{"divide zero by negative", Divide, []float64{0, -5}},
		{"underflow from the negative side", Multiply, []float64{-1e-300, 1e-300}},
		{"percentage of negative zero", Percentage, []float64{negZero, 5}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.operands)
			if err != nil {
				t.Fatalf("Calculate(%q, %v) error = %v, want nil", tt.op, tt.operands, err)
			}
			if got != 0 || math.Signbit(got) {
				t.Errorf("Calculate(%q, %v) = %v (signbit %t), want positive 0", tt.op, tt.operands, got, math.Signbit(got))
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	negZero := math.Copysign(0, -1)
	tests := []struct {
		name     string
		op       Operation
		operands []float64
		wantErr  error
	}{
		{"divide by zero", Divide, []float64{1, 0}, ErrDivisionByZero},
		{"divide by negative zero", Divide, []float64{1, negZero}, ErrDivisionByZero},
		{"zero divided by zero", Divide, []float64{0, 0}, ErrDivisionByZero},
		{"sqrt of a negative number", Sqrt, []float64{-9}, ErrDomain},
		{"power zero to a negative exponent", Power, []float64{0, -1}, ErrDomain},
		{"power negative zero to a negative exponent", Power, []float64{negZero, -1}, ErrDomain},
		{"power negative base with a fractional exponent", Power, []float64{-8, 1.0 / 3}, ErrDomain},
		{"power overflows", Power, []float64{10, 400}, ErrOutOfRange},
		{"multiply overflows", Multiply, []float64{1e308, 10}, ErrOutOfRange},
		{"add overflows", Add, []float64{math.MaxFloat64, math.MaxFloat64}, ErrOutOfRange},
		{"subtract overflows", Subtract, []float64{-math.MaxFloat64, math.MaxFloat64}, ErrOutOfRange},
		{"divide overflows", Divide, []float64{math.MaxFloat64, 0.5}, ErrOutOfRange},
		{"percentage whose final result overflows", Percentage, []float64{1e300, 1e300}, ErrOutOfRange},
		{"NaN operand is a domain error", Add, []float64{math.NaN(), 1}, ErrDomain},
		{"infinite operand is out of range", Add, []float64{math.Inf(1), 1}, ErrOutOfRange},
		{"unsupported operation", "modulo", []float64{1, 2}, ErrUnsupportedOperation},
		{"empty operation", "", []float64{1, 2}, ErrUnsupportedOperation},
		{"operation ids are case-sensitive", "ADD", []float64{1, 2}, ErrUnsupportedOperation},
		{"binary operation without operands", Add, nil, ErrInvalidOperandCount},
		{"binary operation with one operand", Add, []float64{1}, ErrInvalidOperandCount},
		{"binary operation with three operands", Add, []float64{1, 2, 3}, ErrInvalidOperandCount},
		{"sqrt with two operands", Sqrt, []float64{4, 4}, ErrInvalidOperandCount},
		{"sqrt without operands", Sqrt, []float64{}, ErrInvalidOperandCount},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.operands)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Calculate(%q, %v) error = %v, want %v", tt.op, tt.operands, err, tt.wantErr)
			}
			if got != 0 {
				t.Errorf("Calculate(%q, %v) result = %v alongside an error, want 0", tt.op, tt.operands, got)
			}
		})
	}
}

func TestArity(t *testing.T) {
	tests := []struct {
		op   Operation
		want int
	}{
		{Add, 2},
		{Subtract, 2},
		{Multiply, 2},
		{Divide, 2},
		{Power, 2},
		{Sqrt, 1},
		{Percentage, 2},
	}

	for _, tt := range tests {
		t.Run(string(tt.op), func(t *testing.T) {
			got, err := Arity(tt.op)
			if err != nil {
				t.Fatalf("Arity(%q) error = %v, want nil", tt.op, err)
			}
			if got != tt.want {
				t.Errorf("Arity(%q) = %d, want %d", tt.op, got, tt.want)
			}
		})
	}
}

func TestArityRejectsUnsupportedOperations(t *testing.T) {
	for _, op := range []Operation{"modulo", "", "ADD", "Sqrt", " add"} {
		t.Run("op="+string(op), func(t *testing.T) {
			if _, err := Arity(op); !errors.Is(err, ErrUnsupportedOperation) {
				t.Errorf("Arity(%q) error = %v, want %v", op, err, ErrUnsupportedOperation)
			}
		})
	}
}

func TestOperationsListsAllInContractOrder(t *testing.T) {
	want := []Operation{Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage}

	if got := Operations(); !slices.Equal(got, want) {
		t.Errorf("Operations() = %v, want %v", got, want)
	}
}

func TestOperationsReturnsACopy(t *testing.T) {
	first := Operations()
	first[0] = "tampered"

	if got := Operations()[0]; got != Add {
		t.Errorf("Operations()[0] = %q after mutating a previous result, want %q", got, Add)
	}
}

func TestEveryListedOperationHasAnArity(t *testing.T) {
	for _, op := range Operations() {
		if _, err := Arity(op); err != nil {
			t.Errorf("Arity(%q) error = %v, want nil", op, err)
		}
	}
}

func TestEveryRegisteredOperationIsListed(t *testing.T) {
	if len(order) != len(registry) {
		t.Errorf("order has %d operations, registry has %d: add new operations to both", len(order), len(registry))
	}
}
