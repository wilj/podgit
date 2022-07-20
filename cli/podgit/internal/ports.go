package internal

import (
	"context"

	"github.com/wilj/podgit/cli/podgit/env"

	"fmt"
	"strings"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/drael/GOnetstat"
	"github.com/rs/zerolog/log"
)

type PortInfo struct {
	Port  int    `json:"port"`
	Url   string `json:"url"`
	Title string `json:"title"`
}

func getTitle(ports []PortInfo, port int) string {
	for _, pi := range ports {
		if pi.Port == port {
			return pi.Title
		}
	}
	return ""
}

func getPortUrl(port int) string {
	url := env.WorkspaceUrl
	url = strings.Replace(url, "https://", fmt.Sprintf("https://%d-", port), -1)
	return url
}

func getDockerPortInfo(ports *[]PortInfo) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Error().Err(err).Msg("Error creating Docker client")
		return
	}

	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{})
	if err != nil {
		log.Error().Err(err).Msg("Error listing Docker containers")
		return
	}

	for _, c := range containers {
		for _, p := range c.Ports {
			for i, pi := range *ports {
				if p.PublicPort == uint16(pi.Port) {
					names := strings.Join(c.Names, ", ")
					title := fmt.Sprintf("%s - %s", names, c.Image)
					originalTitle := (*ports)[i].Title
					if originalTitle != "" {
						title = fmt.Sprintf("%s: %s", originalTitle, title)
					}
					(*ports)[i].Title = title
				}
			}
		}
	}
}

func Ports(fromFlags []PortInfo) []PortInfo {
	d := GOnetstat.Tcp()
	var ports []PortInfo
	for _, p := range d {
		// Check STATE to show only Listening connections
		if p.State == "LISTEN" {
			url := getPortUrl(int(p.Port))
			pi := PortInfo{Port: int(p.Port), Url: url}

			title := getTitle(fromFlags, pi.Port)
			if title == "" && (p.Name != "" || p.Exe != "") {
				title = fmt.Sprintf("%s - %s", p.Name, p.Exe)
			}
			pi.Title = title
			ports = append(ports, pi)
		}
	}

	getDockerPortInfo(&ports)

	return ports
}
