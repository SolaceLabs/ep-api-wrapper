const axios = require('axios')

// Class
class EventPortal {
  constructor(solaceCloudToken) {
    if (!(solaceCloudToken || process.env.SOLACE_CLOUD_TOKEN)) {
      throw new Error('You must define the Solace Cloud token')
    }
    this.token = solaceCloudToken || process.env.SOLACE_CLOUD_TOKEN
  }

  /**
  * Create Application Version. If overwrite flag is true, Patches existing version if state is DRAFT. Throws error otherwise
  *
  * @param  {Object} applicationVersion - Application configuration object.
  * @param  {String} applicationVersion.applicationID - Application Object ID
  * @param  {String} applicationVersion.displayName - Application display name
  * @param  {String} applicationVersion.description - Application description
  * @param  {String} applicationVersion.version - Application version 
  * @param  {Array} applicationVersion.declaredProducedEventVersionIds - List of Produced events
  * @param  {Array} applicationVersion.declaredConsumedEventVersionIds - List of Consumed events
  * @param  {String} applicationVersion.type - Application type
  * @param  {Bool} overwrite - Overwrites existing version if state is DRAFT. Default: False
  */
   async createApplicationVersion(applicationVersion = {
    applicationID: String,
    description: String,
    version: String,
    displayName: String,
    declaredProducedEventVersionIds: Array,
    declaredConsumedEventVersionIds: Array,
    type: String}, overwrite = false) {
    try {
      const response = await this.api(this.token, 'POST', `applications/${applicationVersion.applicationID}/versions`, applicationVersion)
      let applicationName = await this.getApplicationName(applicationVersion.applicationID)
      console.log(`Application Version ${applicationVersion.version} for application ${applicationName} created!`)
      return response.data.length == 0 ? null : response.data.id
    } catch (error) {
      if (overwrite) {
        let applicationState = error.toString().includes("applicationVersion has been passed in an invalid format") ? await this.getApplicationState(applicationVersion.applicationID, applicationVersion.version) : null
        if (applicationState == "RELEASED" || applicationState == "DEPRECATED" || applicationState == "RETIRED") {
          throw new Error(`Application ${applicationVersion.displayName} version ${applicationVersion.version} is ${applicationState}`)
        } else if (applicationState == "DRAFT") {
          let applicationVersionID = await this.getApplicationVersionID(applicationVersion.applicationID,applicationVersion.version)
          const response = await this.api(this.token, 'PATCH', `applications/${applicationVersion.applicationID}/versions/${applicationVersionID}`, applicationVersion)
          let applicationName = await this.getApplicationName(applicationVersion.applicationID)
          console.log(`Patched Application "${applicationName}" Version ${applicationVersion.version}`)
          return response.data.id
        }
      } 
      throw new Error(error)
    }
  }

  /**
  * Gets the state of the Application given the ID and the version number
  *
  * @param  {String} applicationID - Application ID
  * @param  {String} applicationVersion - Application version
  */
  async getApplicationState(applicationID, applicationVersion){
    try {
      const response = await this.api(this.token, "GET", `applications/${applicationID}/versions?version=${applicationVersion}`)
      let stateID = response.data.length == 0 ? null : response.data[0].stateId
      switch (stateID) {
        case "1":
          return "DRAFT"
        case "2":
          return "RELEASED"
        case "3":
          return "DEPRECATED"
        case "4":
          return "RETIRED"
        default:
          return null
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Create application object. If Application object name already exists, return matching Application object ID
  *
  * @param  {Object} application - Application configuration object.
  * @param  {String} application.applicationDomainId - Application Domain ID.
  * @param  {String} application.name - Application name
  * @param  {String} application.applicationType - Application type
  * @returns {Array} Application object ID
  */
   async createApplicationObject(application = {
    applicationDomainId: String,
    name: String,
    applicationType: String}) {

    try {
      const response = await this.api(this.token, 'POST', `applications`, application)
      console.log(`Application ${application.name} created!`)
      return response.data.id
    } catch (error) {
      let applicationID = error.toString().includes("must be unique within application domain") ? await this.getApplicationIDs(application.name) : null
      if (!applicationID) {
        throw new Error(error)
      }
      return applicationID
    }
  }

  /**
  * Gets the Application name given the application ID
  *
  * @param  {String} applicationID - Application ID
  * @returns {String} Application name
  */
  async getApplicationName(applicationID) {
    try {
      const response = await this.api(this.token, 'GET', `applications/${applicationID}`)
      return response.data.name
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return an array of matching application name IDs
  *
  * @param  {String} applicationName - Application name
  * @returns {Array} Application ID
  */
  async getApplicationIDs(applicationName) {
    try {
      console.log(`Fetching application ID(s) for application name: ${applicationName}`)
      const response = await this.api(this.token, 'GET', `applications?name=${applicationName}`)
      let ids = []
      response.data.map(a =>{
        ids.push(a.id)
      })
      return ids
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return the application version IDs given the applicationID and applicationVersion
  *
  * @param  {String} applicationID - Application object ID
  * @param  {String} applicationVersion - Application version name
  * @returns {String} Application Version ID
  */
   async getApplicationVersionID(applicationID, applicationVersion) {
    try {
      const response = await this.api(this.token, 'GET', `applications/${applicationID}/versions?versions=${applicationVersion}`)
    for (var application of response.data) {
      if (application.version == applicationVersion) {
        return application.id
      }
    }
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return the application version object given the applicationID and applicationVersion
  *
  * @param  {String} applicationID - Application object ID
  * @param  {String} applicationVersion - Application version name
  * @returns {Object} Application Version Object
  */
     async getApplicationVersionObject(applicationID, applicationVersion) {
        try {
          const response = await this.api(this.token, 'GET', `applications/${applicationID}/versions?versions=${applicationVersion}`)
        for (const application of response.data) {
          if (application.version == applicationVersion) {
            return application
          }
        }
        } catch (error) {
          throw new Error(error)
        }
      }
    
  
  /**
  * Create Event Version. If overwrite flag is true, Patches existing version if state is DRAFT. Throws error otherwise
  *
  * @param  {Object} eventVersion - Schema configuration object.
  * @param  {String} eventVersion.eventID - Event Object ID.
  * @param  {String} eventVersion.displayName - Event Version name
  * @param  {String} eventVersion.version - Event Version number
  * @param  {String} eventVersion.schemaVersionId - Schema version ID
  * @param  {Object} eventVersion.deliveryDescriptor - Event version details
  * @param  {String} eventVersion.deliveryDescriptor.brokerType - The type of broker the event belongs to 
  * @param  {Object} eventVersion.deliveryDescriptor.address - the topic hierarchy
  * @param  {Array} eventVersion.deliveryDescriptor.address.addressLevels - Array containing the level name and level type
  * @param  {String} eventVersion.deliveryDescriptor.address.addressLevels.name - Level string name
  * @param  {String} eventVersion.deliveryDescriptor.address.addressLevels.addressLevelType - Level type: literal, variable
  * @param  {String} eventVersion.stateID - Event version state
  * @param  {Bool} overwrite - Overwrites existing version if state is DRAFT. Default: False
  */
   async createEventVersion(eventVersion = {
    eventID: String,
    displayName: String,
    description: String,
    version: String,
    schemaVersionId: String,
    deliveryDescriptor: {
      brokerType: String,
      address: Array
    },
    stateID: String}, overwrite = false) {
    try {
      const response = await this.api(this.token, 'POST', `events/${eventVersion.eventID}/versions`, eventVersion)
      let eventName = await this.getEventName(eventVersion.eventID)
      console.log(`Event Version ${eventVersion.version} for Event ${eventName} created!`)
      return response.data.id
    } catch (error) {
      if (overwrite) {
        let eventState = error.toString().includes("eventVersion has been passed in an invalid format") ? await this.getEventState(eventVersion.eventID, eventVersion.version) : null
        if (eventState == "RELEASED" || eventState == "DEPRECATED" || eventState == "RETIRED") {
          throw new Error(`Event ${eventVersion.displayName} version ${eventVersion.version} is ${eventState}`)
        } else if (eventState == "DRAFT") {
          let eventVersionID = await this.getEventVersionID(eventVersion.eventID,eventVersion.version)
          const response = await this.api(this.token, 'PATCH', `events/${eventVersion.eventID}/versions/${eventVersionID}`, eventVersion)
          let eventName = await this.getEventName(eventVersion.eventID)
          console.log(`Patched Event "${eventName}" Version ${eventVersion.version}`)
          return response.data.id
        }
      } 
      throw new Error(error)
    }
  }

  /**
  * Gets the state of the Event given the ID and the version number
  *
  * @param  {String} eventID - Event ID
  * @param  {String} eventVersion - Event version
  */
   async getEventState(eventID, eventVersion){
    try {
      const response = await this.api(this.token, "GET", `events/${eventID}/versions?version=${eventVersion}`)
      let stateID = response.data.length == 0 ? null : response.data[0].stateId
      switch (stateID) {
        case "1":
          return "DRAFT"
        case "2":
          return "RELEASED"
        case "3":
          return "DEPRECATED"
        case "4":
          return "RETIRED"
        default:
          return null
      }
    } catch (error) {
      throw new Error(error)
    }
  }
  
  /**
  * Return the event version IDs given the eventID and eventVersion
  *
  * @param  {String} eventID - Event object ID
  * @param  {String} eventVersion - Event version name
  * @returns {String} Event Version ID
  */
   async getEventVersionID(eventID, eventVersion) {
    try {
      const response = await this.api(this.token, 'GET', `events/${eventID}/versions?versions=${eventVersion}`)
    for (var event of response.data) {
      if (event.version == eventVersion) {
        return event.id
      }
    }
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return the event version object given the eventVersionId
  * In this case we don't have the eventID, so we need to get the object directly from the eventVersionID
  * * Warning * : This is not an offically supported Event Portal API
  * 
  * @param  {String} eventVersionId - Event version object ID
  * @returns {Object} Event Version Object
  */
  async getEventVersionObject(eventVersionId) {
    try {
      const response = await this.api(this.token, 'GET', `eventVersions/${eventVersionId}`)
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return the Event name given the event ID
  *
  * @param  {String} eventID - Event object ID
  * @returns {String} Event Name
  */
  async getEventName(eventID) {
    try {
      const response = await this.api(this.token, 'GET', `events/${eventID}`)
      return response.data.name
    } catch (error) {
    }
  }

  /**
  * Return an array of matching event name IDs
  *
  * @param  {String} eventName - Event name
  * @returns {Array} Event IDs
  */
  async getEventIDs(eventName) {
    try {
      console.log(`Fetching Event ID for Event: ${eventName}`)
      const response = await this.api(this.token, 'GET', `events?name=${eventName}`)
      let ids = []
      response.data.map(a =>{
        ids.push(a.id)
      })
      return ids
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Create Event object. If Event object name already exists, return matching Event object ID
  *
  * @param  {Object} event - Event configuration object.
  * @param  {String} event.applicationDomainId - Application Domain ID.
  * @param  {String} event.name - Event name
  * @param  {Boolean} event.shared - If the event is to be shared across application domains
  * @returns {String} Event object ID
  */
   async createEventObject(event = {
    applicationDomainId: String,
    name: String,
    shared: Boolean}) {

    try {
      const response = await this.api(this.token, 'POST', `events`, event)
      console.log(`Event ${event.name} created!`)
      return response.data.id
    } catch (error) {
      let eventID = error.toString().includes("must be unique within application domain") ? await this.getEventIDs(event.name) : null
      if (!eventID) {
        throw new Error(error)
      }
      return eventID
    }
  }

  /**
  * Create Schema Version. If overwrite flag is true, Patches existing version if state is DRAFT. Throws error otherwise
  *
  * @param  {Object} schemaVersion - Schema configuration object.
  * @param  {String} schemaVersion.schemaID - Schema Object ID
  * @param  {String} schemaVersion.displayName - Schema display name
  * @param  {String} schemaVersion.description - Schema description
  * @param  {String} schemaVersion.version - Schema version 
  * @param  {string} schemaVersion.content - Schema content
  * @param  {String} schemaVersion.stateID - Schema state ID
  * @param  {Bool} overwrite - Overwrites existing version if state is DRAFT. Default: False
  */
   async createSchemaVersion(schemaVersion = {
    schemaID: String,
    description: String,
    version: String,
    displayName: String,
    content: String,
    stateID: String}, overwrite = false) {
    try {
      const response = await this.api(this.token, 'POST', `schemas/${schemaVersion.schemaID}/versions`, schemaVersion)
      let schemaName = await this.getSchemaName(schemaVersion.schemaID)
      console.log(`Schema Version ${schemaVersion.version} for Schema ${schemaName} created!`)
      return response.data.id
    } catch (error) {
      if (overwrite) {
        let schemaState = error.toString().includes("already in use") ? await this.getSchemaState(schemaVersion.schemaID, schemaVersion.version) : null
        if (schemaState == "RELEASED" || schemaState == "DEPRECATED" || schemaState == "RETIRED") {
          throw new Error(`Schema ${schemaVersion.displayName} version ${schemaVersion.version} is ${schemaState}`)
        } else if (schemaState == "DRAFT") {
          let schemaVersionID = await this.getSchemaVersionID(schemaVersion.schemaID,schemaVersion.version)
          const response = await this.api(this.token, 'PATCH', `schemas/${schemaVersion.schemaID}/versions/${schemaVersionID}`, schemaVersion)
          let schemaName = await this.getSchemaName(schemaVersion.schemaID)
          console.log(`Patched Schema "${schemaName}" Version ${schemaVersion.version}`)
          return response.data.id
        }
      } 
      throw new Error(error)
    }
  }
  
  /**
  * Gets the state of the Schema given the ID and the version number
  *
  * @param  {String} schemaID - Schema ID
  * @param  {String} schemaVersion - Schema version
  */
   async getSchemaState(schemaID, schemaVersion){
    try {
      const response = await this.api(this.token, "GET", `schemas/${schemaID}/versions?version=${schemaVersion}`)
      let stateID = response.data.length == 0 ? null : response.data[0].stateId
      switch (stateID) {
        case "1":
          return "DRAFT"
        case "2":
          return "RELEASED"
        case "3":
          return "DEPRECATED"
        case "4":
          return "RETIRED"
        default:
          return null
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return the schema name given the schema ID
  *
  * @param  {String} schemaID - Schema object ID
  * @returns {String} Schema Name
  */
  async getSchemaName(schemaID) {
    try {
      const response = await this.api(this.token, 'GET', `schemas/${schemaID}`)
      return response.data.name
    } catch (error) {
    }
  }

  /**
  * Return the schema version IDs given the schemaID and schemaVersion
  *
  * @param  {String} schemaID - Schema object ID
  * @param  {String} schemaVersion - Schema version name
  * @returns {String} Schema Version ID
  */
   async getSchemaVersionID(schemaID, schemaVersion) {
    try {
      const response = await this.api(this.token, 'GET', `schemas/${schemaID}/versions?versions=${schemaVersion}`)
    for (var schema of response.data) {
      if (schema.version == schemaVersion) {
        return schema.id
      }
    }
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return an array of matching schema name IDs
  *
  * @param  {String} schemaName - Schema name
  * @returns {Array} Schema IDs
  */
  async getSchemaIDs(schemaName) {
    try {
      console.log(`Fetching Schema ID for Schema: ${schemaName}`)
      const response = await this.api(this.token, 'GET', `schemas?name=${schemaName}`)
      let ids = []
      response.data.map(a =>{
        ids.push(a.id)
      })
      return ids
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Return the schema version object given the schemaVersionId
  * In this case we don't have the parent schema ID, so we need to get it from the schemaVersionId
  * * Warning * : This is not an offically supported Event Portal API
  *
  * @param  {String} schemaVersionId - Schema version object ID
  * @returns {Object} Schema Version Object
  */
     async getSchemaVersionObject(schemaVersionId) {
        try {
          const response = await this.api(this.token, 'GET', `schemaVersions/${schemaVersionId}`)
          return response.data
        } catch (error) {
          throw new Error(error)
        }
      }
        
    
  /**
  * Create Schema object. If Schema object name already exists, return matching schema object ID
  *
  * @param  {Object} schema - Schema configuration object.
  * @param  {String} schema.applicationDomainId - Application Domain ID.
  * @param  {String} schema.name - Schema name
  * @param  {Boolean} schema.shared - If the schema is to be shared across application domains
  * @param  {String} schema.contentType - Schema content type. e.g. json
  * @param  {String} schema.schemaType - Schema type. e.g. jsonSchema
  * @returns {String} Schema object ID
  */
  async createSchemaObject(schema = {
    applicationDomainId: String,
    name: String,
    shared: Boolean,
    contentType: String,
    schemaType: String}) {

    try {
      const response = await this.api(this.token, 'POST', `schemas`, schema)
      console.log(`Schema ${schema.name} created!`)
      return response.data.id
    } catch (error) {
      let schemaID = error.toString().includes("must be unique within application domain") ? await this.getSchemaIDs(schema.name) : null
      if (!schemaID) {
        throw new Error(error)
      }
      return schemaID
    }
  }

  /**
  * Get Application DomainID.
  *
  * @param  {String} domain - Application Domain name.
  */
  async getApplicationDomainID(domainName) {
    try {
      console.log(`Fetching Domain ID for Application Domain: ${domainName}`)
      const response = await this.api(this.token, 'GET', `applicationDomains?name=${domainName}`)
      return response.data.length == 0 ? null : response.data[0].id
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get Application Domain Name.
  *
  * @param  {String} domainID - Application DomainID.
  */
   async getApplicationDomainName(domainID) {
    if(domainID){
      try {
        console.log(`Fetching Domain Name for ApplicationDomainID: ${domainID}`)
        const response = await this.api(this.token, 'GET', `applicationDomains?ids=${domainID}`)
        return response.data[0].name
      } catch (error) {
        throw new Error(error)
      }
    }
    return null
  }

  /**
  * Create Application Domain. If Application Domain already exists, return matching domain ID
  *
  * @param  {Object} domain - Application Domain configuration object.
  * @param  {String} domain.name - Application Domain name.
  * @param  {String} domain.description - Application Domain description
  * @param  {Boolean} domain.uniqueTopicAddressEnforcementEnabled - Used to enforce Topic Address
  * @param  {Boolean} domain.topicDomainEnforcementEnabled - Used to enforce Topic Domain Address
  * @param  {String} domain.type - Event Portal object type
  * @returns {String} Application Domain ID.
  */
  async createApplicationDomain(domain = {
    name: String,
    description: String,
    uniqueTopicAddressEnforcementEnabled: Boolean,
    topicDomainEnforcementEnabled: Boolean,
    type: String}) {
      
    try {
      const response = await this.api(this.token, 'POST', `applicationDomains`, domain)
      console.log(`Application Domain ${domain.name} created!`)
      return response.data.length == 0 ? null : response.data.id
    } catch (error) {
      let domainID = error.toString().includes("already exists") ? await this.getApplicationDomainID(domain.name) : null
      if (!domainID) {
        throw new Error(error)
      }
      return domainID
    }
  }

  async api(token, method, endpoint, data = {}) {
    try {
      if (!token || !method || !endpoint) {
        throw new Error('You must pass a SolaceCloud Token, method, and endpoint')
      };
      const url = `https://api.solace.cloud/api/v2/architecture/${endpoint}`;
      const response = await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${
            token
          }`
        }
      });
      return response?.data
    } catch (error) {
      throw new Error(error.response.data.message)
    }
  }

}
module.exports = EventPortal
