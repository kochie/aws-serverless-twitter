package main

import (
	"context"
	"fmt"
	"github.com/g8rswimmer/go-twitter/v2"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func listen(token string) {

	client := &twitter.Client{
		Authorizer: authorize{
			Token: token,
		},
		Client: http.DefaultClient,
		Host:   "https://api.twitter.com",
	}

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM, syscall.SIGKILL)

	user, err := client.AuthUserLookup(context.Background(), twitter.UserLookupOpts{})
	if err != nil {
		panic(err)
	}

	ticker := time.NewTicker(1000 * time.Millisecond)

	sinceId := ""

	for {
		select {
		case <-ch:
			fmt.Println("closing")
			return
		case <-ticker.C:
			opts := twitter.UserTweetTimelineOpts{
				SinceID: sinceId,
			}
			timeline, err := client.UserTweetTimeline(context.Background(), user.Raw.Users[0].ID, opts)
			if err != nil {
				panic(err)
			}

			if len(timeline.Raw.Tweets) == 0 {
				continue
			}

			sinceId = timeline.Raw.Tweets[0].ID

			tweets := timeline.Raw.Tweets
			for i := len(tweets) - 1; i >= 0; i-- {
				fmt.Println(tweets[i].Text)
			}
		}
	}
}
