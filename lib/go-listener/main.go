package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

var users []string

func init() {
	users = []string{}
}

type UserPostBody struct {
}

type authorize struct {
	Token string
}

func (a authorize) Add(req *http.Request) {
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", a.Token))
}

func handleUsers(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodPost:
		err := json.NewDecoder(req.Body).Decode(&UserPostBody{})
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	}
}

func handleHealthcheck(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func main() {
	http.HandleFunc("/users", handleUsers)
	http.HandleFunc("/healthcheck", handleHealthcheck)
	err := http.ListenAndServe(":8090", nil)
	if err != nil {
		fmt.Println(err)
	}
}
