const assert = require('assert');
const TwitterOEmbedProvider = require('../../../../../core/server/services/oembed/twitter-embed');
const externalRequest = require('../../../../../core/server/lib/request-external');
const nock = require('nock');
const sinon = require('sinon');
const dnsPromises = require('dns').promises;

describe('TwitterOEmbedProvider', function () {
    before(async function () {
        nock.disableNetConnect();
    });

    beforeEach(function () {
        // external requests will attempt dns lookup
        sinon.stub(dnsPromises, 'lookup').callsFake(function () {
            return Promise.resolve({address: '123.123.123.123'});
        });
    });

    afterEach(async function () {
        nock.cleanAll();
        sinon.restore();
    });

    after(async function () {
        nock.enableNetConnect();
    });

    it('Can support requests for Tweet URLs', async function () {
        const provider = new TwitterOEmbedProvider();

        const tweetURL = new URL(
            'https://twitter.com/Ghost/status/1630581157568839683'
        );

        const supportsRequest = await provider.canSupportRequest(tweetURL);

        assert(supportsRequest, 'Should support Tweet URL');
    });

    it('Receives JSON from external request to Twitter API', async function () {
        const provider = new TwitterOEmbedProvider({
            config: {
                bearerToken: 'test'
            }
        });
        const tweetURL = new URL(
            'https://twitter.com/Ghost/status/1630581157568839683'
        );
    
        // not certain why we hit publish.twitter.com 
        nock('https://publish.twitter.com')
            .get('/oembed')
            .query(true)
            .reply(200, {
                data: {
                    conversation_id: '1630581157568839683',
                    public_metrics: {
                        retweet_count: 6,
                        reply_count: 1,
                        like_count: 27
                    }
                },
                includes: {
                    verified: false,
                    description: 'some description',
                    location: 'someplace, somewhere'
                }
            });

        nock('https://api.twitter.com')
            .get('/2/tweets/')
            .query(true)
            .reply(200, {
                data: {
                    conversation_id: '1630581157568839683',
                    public_metrics: {
                        retweet_count: 6,
                        reply_count: 1,
                        like_count: 27
                    }
                },
                includes: {
                    verified: false,
                    description: 'some description',
                    location: 'someplace, somewhere'
                }
            });

        const oembedData = await provider.getOEmbedData(tweetURL, externalRequest);

        assert.equal(oembedData.type, 'twitter');
        assert.ok(oembedData.data);
        assert.ok(oembedData.includes);
    });
});
