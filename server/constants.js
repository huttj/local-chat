module.exports = {
    DB: {
        NAME: 'LocalChat',
        TABLES: {
            USERS: 'Users',
            CHATS: 'Chats',
            MESSAGES: 'Messages'
        },
        INDEXES: {
            USERS: ['username'],
            CHATS: [],
            MESSAGES: []
        }
    }
};