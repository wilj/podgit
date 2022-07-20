package internal

import (
	"bytes"
	"encoding/json"

	"github.com/wilj/podgit/cli/podgit/env"
	"github.com/wilj/podgit/cli/podgit/pkg/graphql"

	"io"
	"net/http"
	"sort"
	"time"

	"github.com/rs/zerolog/log"
)

func WatchPorts(fromFlags []PortInfo) {
	currentPorts := Ports(fromFlags)
	currentHash := hashPorts(&currentPorts)
	updateWorkspace(currentPorts)
	lastUpdated := time.Now()
	for {
		time.Sleep(time.Second)
		newPorts := Ports(fromFlags)
		newHash := hashPorts(&newPorts)
		if newHash != currentHash {
			updateWorkspace(newPorts)
			lastUpdated = time.Now()
			currentHash = newHash
			currentPorts = newPorts
		} else {
			updateBy := lastUpdated.Add(30 * time.Second)
			if time.Now().After(updateBy) {
				workspaceKeepalive()
				lastUpdated = time.Now()
			}
		}
	}

}

type UpdateWorkspaceData struct {
	Url        string     `json:"url"`
	ContextUrl string     `json:"contextUrl"`
	Ports      []PortInfo `json:"ports"`
}
type UpdateWorkspaceInput struct {
	WorkspaceId string              `json:"workspaceId"`
	Data        UpdateWorkspaceData `json:"data"`
}
type UpdateWorkspaceVariables struct {
	Input UpdateWorkspaceInput `json:"input"`
}
type UpdateWorkspaceMutation struct {
	Query         string                   `json:"query"`
	OperationName string                   `json:"operationName"`
	Variables     UpdateWorkspaceVariables `json:"variables"`
}

func workspaceKeepalive() {
	client := graphql.NewClient(env.GraphqlUrl)
	_, err := client.WorkspaceKeepalive(&graphql.WorkspaceKeepaliveVariables{
		WorkspaceId: graphql.String(env.WorkspaceId),
	})
	if err != nil {
		log.Error().Err(err).Msg("Error sending keepalive")
	}
}

func updateWorkspace(ports []PortInfo) {
	mutation := UpdateWorkspaceMutation{
		Query: `
		mutation UpdateWorkspace($input: UpdateWorkspaceInput!) {
			updateWorkspace(input: $input) {
				clientMutationId
			}
		}
	`,
		OperationName: `UpdateWorkspace`,
		Variables: UpdateWorkspaceVariables{
			UpdateWorkspaceInput{
				WorkspaceId: env.WorkspaceId,
				Data: UpdateWorkspaceData{
					Url:        env.WorkspaceUrl,
					ContextUrl: env.WorkspaceContextUrl,
					Ports:      ports,
				},
			},
		},
	}
	output, err := json.Marshal(mutation)
	if err != nil {
		log.Error().Err(err).Msg("Error marshalling updateworkspace mutation json")
		return
	}
	log.Debug().RawJSON("mutation", output).Msg("about to post")

	client := &http.Client{}

	req, err := http.NewRequest("POST", env.GraphqlUrl, bytes.NewBuffer(output))
	req.Header.Add("Content-Type", `application/json; charset=UTF-8`)
	req.Header.Add("Origin", env.Url)
	req.Header.Add("Authorization", env.ApiKeyHeader)
	resp, err := client.Do(req)

	if err != nil {
		log.Error().Err(err).Msg("Error posting updateworkspace mutation")
		return
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	log.Debug().Str("mutation", string(body)).Msg("post returned")
}

func hashPorts(portinfos *[]PortInfo) string {
	ports := make([]int, len(*portinfos))
	for p := range *portinfos {
		ports[p] = (*portinfos)[p].Port
	}
	// concatenate the port numbers as a "hash"
	sort.Ints(ports)
	hash, err := json.Marshal(ports)
	if err != nil {
		log.Error().Err(err).Ints("ports", ports).Msg("Error serializing port array to create hash")
	}
	return string(hash)
}
