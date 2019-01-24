{ Adapter } = require 'hubot'
Dialogs = require '@dlghq/dialog-bot-sdk'

class Dialogs extends Adapter

  constructor: ->
    super
    @token = process.env['DIALOGS_TOKEN']
    @endpoint = process.env['DIALOGS_ENDPOINT']

  send: (envelope, strings...) ->
    @robot.logger.info "Send"

  reply: (envelope, strings...) ->
    @robot.logger.info "Reply"

  run: ->
    unless @token
      @emit 'error', new Error 'Environment variable "DIALOGS_TOKEN" is required.'
    unless @endpoint
      @emit 'error', new Error 'Environment variable "DIALOGS_ENDPOINT" is required.'

    @bot = new Dialogs({
      @token,
      endpoints: [@endpoint]
    })

    @robot.logger.info "Run"
    @emit "connected"

exports.use = (robot) ->
  new Dialogs robot
