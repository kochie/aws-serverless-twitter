package main

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge/types"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

var ddb *dynamodb.Client
var eb *eventbridge.Client

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("ap-southeast-2"))
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	// Using the Config value, create the DynamoDB client
	ddb = dynamodb.NewFromConfig(cfg)
	eb = eventbridge.NewFromConfig(cfg)
}

func getToken() {

}

func sendTweet(text string) {
	_, err := eb.PutEvents(context.Background(), &eventbridge.PutEventsInput{
		Entries: []types.PutEventsRequestEntry{
			{
				Detail:       aws.String(text),
				DetailType:   aws.String("tweet"),
				EventBusName: aws.String(os.Getenv("EVENT_BUS_NAME")),
				Source:       aws.String("twitter"),
			}},
	})
	if err != nil {
		log.Fatalf("unable to put event, %v", err)
	}
}
