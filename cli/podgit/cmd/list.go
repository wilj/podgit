/*
Copyright © 2021 NAME HERE <EMAIL ADDRESS>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package cmd

import (
	"fmt"
	"strings"

	"github.com/wilj/podgit/cli/podgit/env"
	"github.com/wilj/podgit/cli/podgit/pkg/graphql"

	"github.com/manifoldco/promptui"
	"github.com/muesli/coral"
	"github.com/rs/zerolog/log"
)

type NoteItem struct {
	Id               string `json:"id"`
	ShortTextContent string `json:"shortTextContent"`
}

// listCmd represents the list command
var listCmd = &coral.Command{
	Use:   "list",
	Short: "List notes",
	Long: `List text notes`,
	Run: func(cmd *coral.Command, args []string) {

		client := graphql.NewClient(env.GraphqlUrl)
		notesResponse, err := client.ListNotes()
		if err != nil {
			log.Error().Err(err).Msg("Error listing notes")
			return
		}
		r := notesResponse.NotesList

		if len(*r) == 0 {
			fmt.Println("No notes found")
			return
		}
		notes := make([]NoteItem, 0)
		for _, item := range *r {
			log.Debug().Msgf("Found note: %s", item.ShortTextContent)
			formatted := strings.ReplaceAll(item.ShortTextContent, "\n", " ")
			notes = append(notes, NoteItem{Id: item.ID, ShortTextContent: formatted})
		}

		templates := &promptui.SelectTemplates{
			Label:    "{{ . }}?",
			Active:   "\U0001F336 {{ .ShortTextContent | cyan }}",
			Inactive: "  {{ .ShortTextContent | cyan }}",
			Selected: "\U0001F336 {{ .ShortTextContent | red | cyan }}",
			Details: `
	--------- Selected Note ----------
	{{ "Id:" | faint }}	{{ .Id }}
	{{ "ShortTextContent:" | faint }}	{{ .ShortTextContent }}`,
		}

		searcher := func(input string, index int) bool {
			note := notes[index]
			name := strings.Replace(strings.ToLower(note.ShortTextContent), " ", "", -1)
			input = strings.Replace(strings.ToLower(input), " ", "", -1)

			return strings.Contains(name, input)
		}

		prompt := promptui.Select{
			Label:     "Select note",
			Items:     notes,
			Templates: templates,
			Size:      4,
			Searcher:  searcher,
		}

		selectedIndex, _, err := prompt.Run()

		if err != nil {
			fmt.Printf("Prompt failed %v\n", err)
			return
		}

		selectedId := notes[selectedIndex].Id
		result, err := client.NoteTextContent(&graphql.NoteTextContentVariables{ID: graphql.UUID(selectedId)})
		fmt.Print(result.Note.TextContent)
	},
}

func init() {
	notesCmd.AddCommand(listCmd)
}
