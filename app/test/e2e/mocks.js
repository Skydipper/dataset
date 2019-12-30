const nock = require('nock');

const createMockUser = (mockUser, persist = false) => {
    let scope = nock(process.env.CT_URL);
    if (persist) scope = scope.persist();
    scope.post(/.*auth\/user\/find-by-ids.*/, JSON.stringify({ ids: mockUser.map(e => e.id).sort() }))
        .query(() => true)
        .reply(200, { data: mockUser });
};

module.exports = { createMockUser };
