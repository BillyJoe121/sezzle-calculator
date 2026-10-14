package calculator

import (
	"errors"
	"math"
	"testing"
)

// FuzzCalculate feeds arbitrary floats (including NaN and ±Inf) through every operation, plus an unsupported
// operation id and any operand count, and checks the contract: a nil error means a finite result that is never -0,
// and a non-nil error is one of the package sentinels.
func FuzzCalculate(f *testing.F) {
	nan, inf, negZero := math.NaN(), math.Inf(1), math.Copysign(0, -1)
	seeds := []struct {
		opIndex uint8
		count   uint8
		a, b    float64
	}{
		{0, 2, 0.1, 0.2},
		{1, 2, 1, 3},
		{2, 2, 1e308, 10},
		{3, 2, 1, 0},
		{3, 2, 1, negZero},
		{4, 2, 0, -1},
		{4, 2, -8, 1.0 / 3},
		{4, 2, 10, 400},
		{4, 2, 0, 0},
		{5, 1, -9, 0},
		{5, 1, negZero, 0},
		{6, 2, 15, 200},
		{6, 2, 1e300, 1e10},
		{0, 2, nan, 1},
		{2, 2, inf, 0},
		{7, 2, 1, 2},
		{0, 0, 1, 2},
		{0, 3, 1, 2},
		{5, 2, 4, 4},
	}
	for _, s := range seeds {
		f.Add(s.opIndex, s.count, s.a, s.b)
	}

	sentinels := []error{ErrUnsupportedOperation, ErrInvalidOperandCount, ErrDivisionByZero, ErrDomain, ErrOutOfRange}
	ops := Operations()

	f.Fuzz(func(t *testing.T, opIndex, count uint8, a, b float64) {
		// Index len(ops) selects an unsupported operation id.
		op := Operation("unsupported")
		if int(opIndex) < len(ops) {
			op = ops[opIndex]
		}
		operands := []float64{a, b, a}[:count%4]

		got, err := Calculate(op, operands)
		if err == nil {
			if math.IsNaN(got) || math.IsInf(got, 0) {
				t.Fatalf("Calculate(%q, %v) = %v with a nil error, want a finite result", op, operands, got)
			}
			if got == 0 && math.Signbit(got) {
				t.Fatalf("Calculate(%q, %v) = -0 with a nil error, want 0", op, operands)
			}
			return
		}
		for _, sentinel := range sentinels {
			if errors.Is(err, sentinel) {
				return
			}
		}
		t.Fatalf("Calculate(%q, %v) error = %v, want one of the package sentinels", op, operands, err)
	})
}
