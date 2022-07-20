package graphql

import (
	"net/http"

	"github.com/wilj/podgit/cli/podgit/env"
)

func beforeExecute(req *http.Request) {
	req.Header.Add("Origin", env.Url)
	req.Header.Add("Authorization", env.ApiKeyHeader)
}
