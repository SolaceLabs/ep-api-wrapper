# Solace Pubsub+ Event Portal REST API Wrapper

This module makes implementing the Solace PubSub+ EP REST API in NodeJS/JS applications easier

## Installation

```
npm install @solace-community/eventportal
```

## Constructor

```
const EventPortal = require('@solace-community/eventportal')
const ep = new EventPortal()
// Optional: You can pass Solace Cloud Token as parameter if not defined as environment variable
const ep = new EventPortal(SOLACE_CLOUD_TOKEN)
```

## Environment Variables

| Env Variable       | Description                                 |
| ------------------ | ------------------------------------------- |
| SOLACE_CLOUD_TOKEN | Solace Cloud Token with the right EP access |

## Methods

- createApplicationDomain(domain)
- createSchemaObject(schema)
- createSchemaVersion(schemaVersion)
- createEventObject(event)
- createEventVersion(eventVersion)
- createApplicationObject(application)
- createApplicationVersion(applicationVersion)

## Star this!

## To-Do

- [] Document methods in README
- [] Publish
