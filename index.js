const { Plugin } = require('jovo-framework');
const request = require('request');

const jovoLogo16x16URL = 'https://raw.githubusercontent.com/jovotech/jovo-framework-nodejs/master/docs/img/jovo-logo-16x16.png';

class SlackError extends Plugin {
    constructor(options) {
        super(options);
        this.webhookURL = options.webhookURL;
        this.channel = options.channel ? options.channel : '',
        this.fallback = options.fallback ? options.fallback : 'Error Message';
        this.color = options.color ? options.color : '#ff0000';
        this.pretext = options.pretext ? options.pretext : '' 
        this.author_name = options.author_name ? options.author_name : ''
        this.author_link = options.author_link ? options.author_link : '';
        this.author_icon = options.author_icon ? options.author_icon : '';
        this.title = options.title ? options.title : 'An error has occured!',
        this.title_link = options.title_link ? options.title_link : '';
        this.text = options.text ? options.text : '';
        this.image_url = options.image_url ? options.image_url : '';
        this.thumb_url = options.thumb_url ? options.thumb_url : '';
        this.footer = options.footer ? options.footer : 'Jovo Plugin - Slack Error';
        this.footer_icon = options.footer_icon ? options.footer_icon : jovoLogo16x16URL;
    }

    init() {
        const { app } = this;
        app.on('handlerError', (jovo, err) => {
            let log = this.createLog(jovo, 'Handler Error', err);
            this.sendRequest(log);
        });

        app.on('responseError', (jovo, err) => {
            console.log('kek');
            let log = this.createLog(jovo, 'Response Error', err);
            this.sendRequest(log);
        });
    }

    /**
        * Creates log object
        * @param {String} errorType 
        * @returns {*}
        */
    createLog(jovo, errorType, err) {
        let log = {
            "channel": this.channel,
            "attachments": [
                {
                    "fallback": this.fallback,
                    "color": this.color,
                    "pretext": this.pretext,
                    "author_name": this.author_name,
                    "author_link": this.author_link,
                    "author_icon": this.author_icon,
                    "title": this.title,
                    "title_link": this.title_link,
                    "text": this.text,
                    "image_url": this.image_url,
                    "thumb_url": this.thumb_url,
                    "footer": this.footer,
                    "footer_icon": this.footer_icon,
                    "fields": [
                        {
                            "title": "UserID",
                            "value": jovo.getUserId(),
                            "short": false
                        },
                        {
                            "title": "Timestamp",
                            "value": jovo.getTimestamp(),
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
                    ]
                }
            ]
        }
        return log;
    }

    sendRequest(body) {
        request({
            url: this.webhookURL,
            method: 'POST',
            json: true,
            body: body
        }, function (error, response, body) {
            if (error) {
                console.log(error);
            }
        });
    }
}

module.exports = SlackError;

