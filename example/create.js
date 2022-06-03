const EventPortal = require('../src/index')
const ep = new EventPortal()

const schemaContent = require("./schemaSample.json")

DOMAIN_NAME = process.argv[2] || process.env.SOLACE_APPLICATION_DOMAIN
if (!DOMAIN_NAME) throw new Error("Define Application Domain Name")

async function createEDA(){
  try {
    // 1. Create Application Domain
    let domainID = await ep.createApplicationDomain({
      name: DOMAIN_NAME,
      description: "This is an application domain created via script", 
      uniqueTopicAddressEnforcementEnabled: true,
      topicDomainEnforcementEnabled: false, 
      type: "ApplicationDomain"
    })

    // 2. Create a Schema Object
    let schemaID = await ep.createSchemaObject({
      applicationDomainId: domainID,
      name: "Schema1",
      shared: false,
      contentType: "json",
      schemaType: "jsonSchema"
    })

    // 3. Create a Schema version. If exist  : THROW ERROR
    let schemaVersionID = await ep.createSchemaVersion({
      schemaID: schemaID,
      description: "This is the schema version description",
      version: "0.0.1",
      displayName: "This is the Display name of the schema",
      content: JSON.stringify(schemaContent),
      stateID: "1"
    })

    // SKIP. Create Enumeration object
    // SKIP. Create Enumeration version
    
    // 4. Create an Event object
    let eventID = await ep.createEventObject({
      applicationDomainId: domainID,
      name: "Tamimi's Event",
      shared: false
    })
    
    // 5. Create an Event version and associate a schema and topic to it. If exist: THROW ERROR

    // Topic definitions
    // addressLevel = [{"name": "level1", "addressLevelType": "literal"}]
    let addressLevels = [
      {name: "level1", addressLevelType: "literal"},
      {name: "level2", addressLevelType: "variable"},
      {name: "level3", addressLevelType: "literal"},
      {name: "level4", addressLevelType: "variable"},
    ]

    let eventVersionID = await ep.createEventVersion({
      eventID: eventID,
      displayName: "Scripted Version",
      version: "0.0.1",
      schemaVersionId: schemaVersionID,
      deliveryDescriptor:{
        brokerType: "solace",
        address:{
          addressLevels
        },
        stateID:"1"
      }
    })
    
    // 6. Create Application in Application domain
    let applicationID = await ep.createApplicationObject({
      applicationDomainId: domainID,
      name: "My Scripted Application",
      applicationType: "standard",
    })

    // 7. Create a new Application Version with details. If exists: THROW ERROR

    let applicationVersionID = await ep.createApplicationVersion({
      applicationID: applicationID,
      displayName: "Display Name",
      description: "This is the scripted description",
      version: "0.0.1",
      declaredProducedEventVersionIds:[eventVersionID],
      type: "application"
    })

    console.log("DONE")

  } catch(e) {
    throw new Error(e)
  }
}

createEDA()


// const EventPortal = require('../src/index')
// const ep = new EventPortal()

// async function createEDA(){
//   try {
    // 1. Create Application Domain

    // 2. Create a Schema Object

    // 3. Create a Schema version.

    // 4. Create an Event object
    
    // 5. Create an Event version and associate a schema and topic to it.

    // 6. Create Application in Application domain

    // 7. Create a new Application Version with details.

//   } catch(e) {
//     throw new Error(e)
//   }
// }

// createEDA()
