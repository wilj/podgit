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
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/muesli/coral"
	"github.com/rs/zerolog/log"
	"github.com/wilj/podgit/cli/podgit/internal"
)

var PortFlags []string

// portsCmd represents the ports command
var portsCmd = &coral.Command{
	Use:   "ports",
	Short: "Lists open ports",
	Long: `Lists open ports in JSON format`,
	Run: func(cmd *coral.Command, args []string) {
		portFlags := getPortsFromFlags(PortFlags)
		ports := internal.Ports(portFlags)
		output, err := json.MarshalIndent(ports, "", "  ")
		if err != nil {
			log.Error().Err(err).Msg("Error serializing output")
		}
		fmt.Println(string(output))
	},
}

func init() {
	rootCmd.AddCommand(portsCmd)
	portsCmd.Flags().StringArrayVar(&PortFlags, "port", []string{}, "[port number]=description, e.g. 8080=My HTTP Server")
}

func getPortsFromFlags(flags []string) []internal.PortInfo {
	ports := make([]internal.PortInfo, 0)
	for _, p := range flags {
		pair := strings.SplitN(p, "=", 2)
		portNum, _ := strconv.Atoi(pair[0])
		pi := internal.PortInfo{Port: portNum, Title: pair[1]}
		ports = append(ports, pi)
	}
	return ports
}
