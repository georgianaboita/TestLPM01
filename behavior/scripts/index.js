'use strict'
const firstOfEntityRole = function (message, entity, role) {
    role = role || 'generic';

    console.log('message = ', message)
    const slots = message.slots
    console.log('slots = ', slots)
    const entityValues = message.slots[entity]
    console.log('entityvals = ', entityValues)
    const valsForRole = entityValues ? entityValues.values_by_role[role] : null

    return valsForRole ? valsForRole[0] : null
}

exports.handle = function handle(client) {
    // Create steps
    const sayHello = client.createStep({
        satisfied() {
            return Boolean(client.getConversationState().helloSent)
        },

        prompt() {
            client.addResponse('welcome')
            client.addResponse('provide/documentation', {
                documentation_link: 'http://docs.init.ai',
            })
            client.addResponse('provide/instructions')

            client.updateConversationState({
                helloSent: true
            })

            client.done()
        }
    })

    //const handleGreeting = client.createStep({
    //    satisfied() {
    //        return false
    //    },

    //    prompt() {
    //        //client.addResponse('greeting')
    //        client.addTextResponse('Hello world, I mean human')
    //        client.done()
    //    }
    //})

    const collectCustomerID = client.createStep({
        satisfied() {
            return Boolean(client.getConversationState().customerID)
        },

        extractInfo() {
            const custId = firstOfEntityRole(client.getMessagePart(), 'phone-number/custId')
            console.log('phone-number/custId = ', custId)

            if (custId) {
                client.updateConversationState({
                    customerID: custId,
                })

                console.log('User provided cust Id:', custId.value)
            }
        },

        prompt() {
            client.addResponse('app:response:name:prompt/cutomer_id')
            // Need to prompt user for city    
            console.log('Need to ask user for city')
            client.done()
        },
    })

    const handleGoodbye = client.createStep({
        satisfied() {
            return false
        },

        prompt() {
            //client.addResponse('goodbye')
            client.addTextResponse('See you later!')
            client.done()
        }
    })

    const untrained = client.createStep({
        satisfied() {
            return false
        },

        prompt() {
            client.addResponse('apology/untrained')
            client.done()
        }
    })

    client.runFlow({
        classifications: {
            // map inbound message classifications to names of streams
            //greeting: 'greeting',
            goodbye: 'goodbye'
        },
        autoResponses: {
            // configure responses to be automatically sent as predicted by the machine learning model
        },
        streams: {
            main: 'onboarding',
            goodbye: handleGoodbye,
            onboarding: collectCustomerID,
            end: [untrained],
        },
    })
}
