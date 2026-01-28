import jwt from 'jsonwebtoken';

export default (body, secret, cb) => {
    if (!body) {
        return cb(new Error('invalid jwtdata'));
    }

    jwt.verify(body.toString('utf8'), secret, { algorithm: 'HS256' }, cb);
};