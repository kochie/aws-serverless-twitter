package main

import (
	"flag"
	"fmt"
	"net/http"
)

type authorize struct {
	Token string
}

func (a authorize) Add(req *http.Request) {
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", a.Token))
}

func main() {
	token := flag.String("token", "", "twitter API token")
	flag.Parse()

	listen(*token)
}
