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
	"github.com/wilj/podgit/cli/podgit/internal"

	"github.com/muesli/coral"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

var WatchPortFlags []string

// watchCmd represents the watch command
var watchCmd = &coral.Command{
	Use:   "watch",
	Short: "Watch open ports",
	Long: `Watches open ports and updates Podgit server`,
	Run: func(cmd *coral.Command, args []string) {
		flags := cmd.Flags()

		verbose, _ := flags.GetBool("verbose")

		if verbose {
			zerolog.SetGlobalLevel(zerolog.TraceLevel)
			log.Debug().Msg("Verbose mode enabled")
		} else {
			zerolog.SetGlobalLevel(zerolog.InfoLevel)
		}

		ports := getPortsFromFlags(WatchPortFlags)
		log.Info().Msg("Watching ports...")
		internal.WatchPorts(ports)
	},
}

func init() {
	portsCmd.AddCommand(watchCmd)
	watchCmd.Flags().StringArrayVar(&WatchPortFlags, "port", []string{}, "[port number]=description, e.g. 8080=My HTTP Server")
}
