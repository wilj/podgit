package env

import (
	"fmt"
	"os"
)

func getPodgitUrl() string {
	result := os.Getenv("PODGIT_URL")
	if result == "" {
		result = "https://podgit.cyton.org"
	}
	return result
}

var Url = getPodgitUrl()
var GraphqlUrl = fmt.Sprintf("%s/graphql", Url)

var ApiKey = os.Getenv("PODGIT_API_KEY")
var ApiKeyHeader = fmt.Sprintf("ApiKey %s", ApiKey)

var WorkspaceId = os.Getenv("GITPOD_WORKSPACE_ID")
var WorkspaceUrl = os.Getenv("GITPOD_WORKSPACE_URL")
var WorkspaceContextUrl = os.Getenv("GITPOD_WORKSPACE_CONTEXT_URL")
