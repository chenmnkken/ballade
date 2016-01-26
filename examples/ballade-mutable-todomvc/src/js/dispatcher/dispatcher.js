const Ballade = require('ballade');
const dispatcher = new Ballade.Dispatcher();

// Register debug middleware
dispatcher.use((payload, next) => {
    console.info(`action ${payload.type}`);
    console.log(payload);
    next();
});

export default dispatcher;
