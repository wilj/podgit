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
	"os"

	"github.com/muesli/coral"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

var cfgFile string
var Verbose bool

// rootCmd represents the base command when called without any subcommands
var rootCmd = &coral.Command{
	Use:   "podgit",
	Short: "Podgit client",
	Long: `Podgit workspace tools

	TODO convert these to instructions:

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
	
	`,
	// Run logging initialization for all commands.
	Run: func(cmd *coral.Command, args []string) {
		flags := cmd.Flags()

		verbose, _ := flags.GetBool("verbose")

		if verbose {
			zerolog.SetGlobalLevel(zerolog.TraceLevel)
			log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
			log.Debug().Msg("Verbose mode enabled")
		} else {
			zerolog.SetGlobalLevel(zerolog.InfoLevel)
		}

	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	coral.CheckErr(rootCmd.Execute())
}

func init() {
	coral.OnInitialize(initConfig)

	// Define flags and configuration settings.
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.podgit.yaml)")

	rootCmd.PersistentFlags().BoolVar(&Verbose, "verbose", false, "verbose output")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		coral.CheckErr(err)

		// Search config in home directory with name ".podgit" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigType("yaml")
		viper.SetConfigName(".podgit")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
	}
}
