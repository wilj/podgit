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
	"github.com/wilj/podgit/cli/podgit/env"
	"github.com/wilj/podgit/cli/podgit/pkg/graphql"
	"io"
	"os"

	"github.com/muesli/coral"
	"github.com/rs/zerolog/log"
)

// addCmd represents the add command
var addCmd = &coral.Command{
	Use:   "add",
	Short: "Creates a note from STDIN",
	Long: `Creates a note from STDIN. For example:

	echo "my note" | podgit notes add
`,
	Run: func(cmd *coral.Command, args []string) {
		// read note text from stdin
		noteBytes, err := io.ReadAll(os.Stdin)
		if err != nil {
			log.Error().Err(err).Msg("STDIN input required")
			return
		}
		noteText := string(noteBytes)

		client := graphql.NewClient(env.GraphqlUrl)

		_, err = client.CreateNote(&graphql.CreateNoteVariables{
			TextContent: graphql.String(noteText),
		})

		if err != nil {
			log.Error().Err(err).Msg("Error creating note")
		}
	},
}

func init() {
	notesCmd.AddCommand(addCmd)
}
