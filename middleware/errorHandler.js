const friendlyMessages = {
    400: 'Bad request. Please check what you submitted and try again.',
    401: 'You need to be logged in to access this page.',
    403: 'You do not have permission to do that.',
    404: 'The page or resource you were looking for could not be found.',
    405: 'That action is not allowed here.',
    408: 'The request timed out. Please try again.',
    409: 'There was a conflict, such as a duplicate entry.',
    410: 'This resource no longer exists.',
    413: 'The data you submitted was too large.',
    422: 'The data you submitted could not be processed. Please check your inputs.',
    429: 'Too many requests. Please slow down and try again later.',
    500: 'Something went wrong on our end. Please try again later.',
    502: 'The server received an invalid response. Please try again.',
    503: 'The service is temporarily unavailable. Please try again later.'
};

// this is for routes that dont exist, it goes here
exports.notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// catches all errors passed via next(error) from anywhere in the app
exports.errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    const friendly = friendlyMessages[statusCode] || 'An unexpected error occurred.';
    res.status(statusCode);
    res.send(`
        <h1>Error ${statusCode}</h1>
        <p>${friendly}</p>
        <p style="color:#888; font-size:0.9em;">${err.message}</p>
        <br><a href="/">Go back home</a>
    `);
};
