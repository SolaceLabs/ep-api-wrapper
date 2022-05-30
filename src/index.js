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
  * Create Application Version. Throws error if version already exists
  *
  * @param  {Object} applicationVersion - Application configuration object.
  * @param  {String} applicationVersion.applicationID - Application Object ID
  * @param  {String} applicationVersion.displayName - Application display name
  * @param  {String} applicationVersion.description - Application description
  * @param  {String} applicationVersion.version - Application version 
  * @param  {Array} applicationVersion.declaredProducedEventVersionIds - List of Produced events
  * @param  {Array} applicationVersion.declaredConsumedEventVersionIds - List of Consumed events
  * @param  {String} applicationVersion.type - Application type
  */
   async createApplicationVersion(applicationVersion = {
    applicationID: String,
    description: String,
    version: String,
    displayName: String,
    declaredProducedEventVersionIds: Array,
    declaredConsumedEventVersionIds: Array,
    type: String}) {
    try {
      const response = await this.api(this.token, 'POST', `applications/${applicationVersion.applicationID}/versions`, applicationVersion)
      let applicationName = await this.getApplicationName(applicationVersion.applicationID)
      console.log(`Application Version ${applicationVersion.version} for application ${applicationName} created!`)
      return response.data.id
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Gets the state of the Application given the name and the version number
  *
  * @param  {String} applicationName - Application name
  * @param  {String} applicationVersion - Application version
  */
  async getApplicationState(applicationName, applicationVersion){
    try {
      let applicationID = await this.getApplicationObjectID(applicationName)
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
  * @returns {String} Application object ID
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
      let applicationID = error.toString().includes("must be unique within application domain") ? await this.getApplicationObjectID(application.name) : null
      if (!applicationID) {
        throw new Error(error)
      }
      return applicationID
    }
  }

  async getApplicationName(applicationID) {
    try {
      const response = await this.api(this.token, 'GET', `applications/${applicationID}`)
      return response.data.name
    } catch (error) {
      throw new Error(error)
    }
  }

  async getApplicationObjectID(applicationName) {
    try {
      console.log(`Fetching application ID for application: ${applicationName}`)
      const response = await this.api(this.token, 'GET', `applications?name=${applicationName}`)
      return response.data[0].id
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Create Event Version. Throws error if version already exists
  *
  * @param  {Object} eventVersion - Schema configuration object.
  * @param  {String} eventVersion.eventID - Event Object ID.
  * @param  {String} eventVersion.displayName - Event Version name
  * @param  {String} eventVersion.version - Event Version number
  * @param  {String} eventVersion.payloadSchemaVersionId - Schema version ID
  * @param  {Object} eventVersion.deliveryDescriptor - Event version details
  * @param  {String} eventVersion.deliveryDescriptor.brokerType - The type of broker the event belongs to 
  * @param  {Object} eventVersion.deliveryDescriptor.address - the topic hierarchy
  * @param  {Array} eventVersion.deliveryDescriptor.address.addressLevels - Array containing the level name and level type
  * @param  {String} eventVersion.deliveryDescriptor.address.addressLevels.name - Level string name
  * @param  {String} eventVersion.deliveryDescriptor.address.addressLevels.addressLevelType - Level type: literal, variable
  * @param  {String} eventVersion.stateID - Event version state
  */
   async createEventVersion(eventVersion = {
    eventID: String,
    displayName: String,
    description: String,
    version: String,
    payloadSchemaVersionId: String,
    deliveryDescriptor: {
      brokerType: String,
      address: Array
    },
    stateID: String}) {
    try {
      const response = await this.api(this.token, 'POST', `events/${eventVersion.eventID}/versions`, eventVersion)
      let eventName = await this.getEventName(eventVersion.eventID)
      console.log(`Event Version ${eventVersion.version} for Event ${eventName} created!`)
      return response.data.id
    } catch (error) {
      throw new Error(error)
    }
  }
  
  async getEventName(eventID) {
    try {
      const response = await this.api(this.token, 'GET', `events/${eventID}`)
      return response.data.name
    } catch (error) {
    }
  }

  async getEventObjectID(eventName) {
    try {
      console.log(`Fetching Event ID for Event: ${eventName}`)
      const response = await this.api(this.token, 'GET', `events?name=${eventName}`)
      return response.data[0].id
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
      let eventID = error.toString().includes("must be unique within application domain") ? await this.getEventObjectID(event.name) : null
      if (!eventID) {
        throw new Error(error)
      }
      return eventID
    }
  }

  /**
  * Create Schema Version. Throws error if version already exists
  *
  * @param  {Object} schemaVersion - Schema configuration object.
  * @param  {String} schemaVersion.schemaID - Schema Object ID
  * @param  {String} schemaVersion.displayName - Schema display name
  * @param  {String} schemaVersion.description - Schema description
  * @param  {String} schemaVersion.version - Schema version 
  * @param  {string} schemaVersion.content - Schema content
  * @param  {String} schemaVersion.stateID - Schema state ID
  */
  async createSchemaVersion(schemaVersion = {
    schemaID: String,
    description: String,
    version: String,
    displayName: String,
    content: String,
    stateID: String}) {
    try {
      const response = await this.api(this.token, 'POST', `schemas/${schemaVersion.schemaID}/versions`, schemaVersion)
      let schemaName = await this.getSchemaName(schemaVersion.schemaID)
      console.log(`Schema Version ${schemaVersion.version} for Schema ${schemaName} created!`)
      return response.data.id
    } catch (error) {
      throw new Error(error)
    }
  }

  async getSchemaName(schemaID) {
    try {
      const response = await this.api(this.token, 'GET', `schemas/${schemaID}`)
      return response.data.name
    } catch (error) {
    }
  }

  /**
  * Get SchemaID.
  *
  * @param  {String} schemaName - Schema name.
  * @returns {String} Schema ID
  */
  async getSchemaObjectID(schemaName) {
    try {
      console.log(`Fetching Schema ID for Schema: ${schemaName}`)
      const response = await this.api(this.token, 'GET', `schemas?name=${schemaName}`)
      return response.data[0].id
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
      let schemaID = error.toString().includes("must be unique within application domain") ? await this.getSchemaObjectID(schema.name) : null
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
      return response.data[0].id
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
      return response.data.id
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
