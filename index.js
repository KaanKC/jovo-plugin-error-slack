const { Plugin } = require('jovo-framework');
const request = require('request');

class SlackError extends Plugin {
    constructor(slackWebhookURL, options) {
        super(options);
        this.slackWebhookURL = slackWebhookURL;
    }

    init() {
        const { app } = this;
        app.on('handlerError', (jovo, err) => {
            let log = this.createLog(jovo, 'Handler Error', err);
            this.sendRequest(this.slackWebhookURL, log);
        });

        app.on('responseError', (jovo, err) => {
            let log = this.createLog(jovo, 'Response Error', err);
            this.sendRequest(this.slackWebhookURL, log);
        });
    }

    /**
        * Creates log object
        * @param {String} errorType 
        * @returns {*}
        */
    createLog(jovo, errorType, err) {
        const ts = jovo.getTimestamp();
        let log = {
            "attachments": [
                {
                    "fallback": "Error message",
                    "color": "#ff0000",
                    "title": "An error has occured!",
                    "fields": [
                        {
                            "title": "UserID",
                            "value": jovo.getUserId(),
                            "short": false
                        },
                        {
                            "title": "Timestamp",
                            "value": ts,
                            "short": true
                        },
                        {
                            "title": "Locale",
                            "value": jovo.getLocale(),
                            "short": true
                        },
                        {
                            "title": "Platform",
                            "value": jovo.getType(),
                            "short": false
                        },
                        {
                            "title": "State",
                            "value": jovo.getState() ? jovo.getState() : "-",
                            "short": true
                        },
                        {
                            "title": "Intent",
                            "value": jovo.getIntentName(),
                            "short": true
                        },
                        {
                            "title": "Error Type",
                            "value": errorType,
                            "short": true
                        },
                        {
                            "title": "Error Message",
                            "value": err.stack.toString(),
                            "short": false
                        }
                    ],
                    "image_url": "http://my-website.com/path/to/image.jpg",
                    "thumb_url": "http://example.com/path/to/thumb.png",
                    "footer": "Jovo Error Plugin",
                    "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                    "ts": (new Date(ts)).getTime()
                }
            ]
        }
        return log;
    }

    sendRequest(url, body) {
        request({
            url: url,
            method: 'POST',
            json: true,
            body: body
        });
    }
}

module.exports = SlackError;

