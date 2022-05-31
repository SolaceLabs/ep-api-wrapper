# Solace Pubsub+ Event Portal REST API Wrapper

This module wraps the Solace PubSub+ EP REST API. This can be used to enable the creation of integrations, plugins, and component on top of the Solace PubSub+ Event API.

Dont forget to give this repo a star! ✨

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

## How to use

Check out the `create.js` script in the example directory for API usage.

Here is a video as well

[![PubSub+ Event Portal API Wrapper Demo Video](https://img.youtube.com/vi/Maol3gXuPoc/0.jpg)](https://www.youtube.com/watch?v=Maol3gXuPoc)

## Environment Variables

| Env Variable       | Description                                 |
| ------------------ | ------------------------------------------- |
| SOLACE_CLOUD_TOKEN | Solace Cloud Token with the right EP access |

## Methods

<details>
  <summary>createApplicationDomain(domain)</summary>
    Creates an application domain given a domain object. An example of an application domain object :

```
domain = {
  name: "Application Domain name",
  description: "Application Domain description",
  uniqueTopicAddressEnforcementEnabled: true,
  topicDomainEnforcementEnabled: false,
  type: "ApplicationDomain"
}
```

### Returns

- Application Domain ID

### Notes

- If Application Domain name exists, matching Application Domain ID is returned
</details>

<details>
  <summary>createSchemaObject(schema)</summary>
    Creates an EP Schema Object in the Application Domain given a schema object definition. An example of a schema object :

```
schema = {
  applicationDomainId: domainID,
  name: "Schema1",
  shared: false,
  contentType: "json",
  schemaType: "jsonSchema"
}
```

### Returns

- Schema Object ID

### Notes

- If the Schema name exists, matching Schema Object ID is returned
</details>

<details>
  <summary>createSchemaVersion(schemaVersion)</summary>
    Creates a Schema version given a schema version definition. An example of a schema version object :

```
schemaVersion = {
  schemaID: schemaID,
  description: "This is the schema version description",
  version: "0.0.1",
  displayName: "This is the Display name of the schema",
  content: JSON.stringify(schemaContent),
  stateID: "1"
}
```

### Returns

- Schema Object ID

### Notes

- If the Schema version exists, an error is thrown
- The schema content is in string format

</details>

<details>
  <summary>createEventObject(event)</summary>
    Creates an EP Event Object in the Application Domain given an event object definition. An example of a event object :

```
event = {
  applicationDomainId: domainID,
  name: "Event Name",
  shared: false
}
```

### Returns

- Event Object ID

### Notes

- If the Event name exists, matching Event Object ID is returned
</details>

<details>
  <summary>createEventVersion(eventVersion)</summary>
    Creates an Event version given an event version definition. An example of an event version object :

```
eventVersion = {
  eventID: eventID,
  displayName: "Scripted Version",
  version: "0.0.1",
  payloadSchemaVersionId: schemaVersionID,
  deliveryDescriptor:{
    brokerType: "solace",
    address:{
      addressLevels
    },
    stateID:"1"
  }
}
```

### Returns

- Event Object ID

### Notes

- If the Event version exists, an error is thrown
- the `addressLevels` parameter is an array with the following format

```
let addressLevels = [
      {name: "level1", addressLevelType: "literal"},
      {name: "level2", addressLevelType: "variable"},
      {name: "level3", addressLevelType: "literal"},
      {name: "level4", addressLevelType: "variable"},
    ]
```

</details>

<details>
  <summary>createApplicationObject(application)</summary>
    Creates an EP Application Object in the Application Domain given an application object definition. An example of a application object :

```
application = {
  applicationDomainId: domainID,
  name: "My Scripted Application",
  applicationType: "standard",
}
```

### Returns

- Application Object ID

### Notes

- If the Application name exists, matching Application Object ID is returned
</details>

<details>
  <summary>createApplicationVersion(applicationVersion)</summary>
    Creates an Application version given an application version definition. An example of an application version object :

```
applicationVersion = {
  applicationID: applicationID,
  displayName: "Display Name",
  description: "This is the scripted description",
  version: "0.0.1",
  declaredProducedEventVersionIds:[eventVersionID],
  type: "application"
}
```

### Returns

- Application Object ID

### Notes

- If the Application version exists, an error is thrown
- `declaredProducedEventVersionIds` is an array of produced events
- `declaredConsumedEventVersionIds` is an array of consumed events
</details>

<details>
  <summary>getApplicationName(applicationID)</summary>
    Returns the Application Name given ApplicationID
</details>

<details>
  <summary>getApplicationIDs(applicationName)</summary>
    Return an array of matching applicatio  name IDs
</details>

<details>
  <summary>getEventName(eventID)</summary>
    Returns the Event Name given EventID
</details>

<details>
  <summary>getEventIDs(eventName)</summary>
    Returns an array of matching event name IDs
</details>

<details>
  <summary>getSchemaName(schemaID)</summary>
    Returns the Schema Name given SchemaID
</details>

<details>
  <summary>getSchemaIDs(schemaName)</summary>
    Return an array of matching schema name IDs
</details>

<details>
  <summary>getApplicationDomainID(domainName)</summary>
    Returns the ApplicationDomainID given Application Domain Name
</details>

<details>
  <summary>getApplicationState(applicationID, applicationVersion)</summary>
    Returns the Application State given the application ID and application version. The current states are 
    - DRAFT
    - RELEASED
    - DEPRECATED
    - RETIRED
</details>

## To-Do

- [ ] Add Jest unit tests
