package main

type Query struct {
	Op string `json:"op,omitempty"`
	// Exprs 复合查询，op 为 and or not 时 exprs 可以有值
	Exprs []Query  `json:"exprs,omitempty"`
	Key   string   `json:"key,omitempty"`
	Value []string `json:"value,omitempty"`
}

func main() {}
