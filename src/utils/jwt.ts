import jwt from 'jsonwebtoken';

export function generateWeatherKitToken(): string {
    const keyId = process.env.WEATHERKIT_KEY_ID!;
    const teamId = process.env.WEATHERKIT_TEAM_ID!;
    const serviceId = process.env.WEATHERKIT_SERVICE_ID!;

    const privateKey = process.env.WEATHERKIT_PRIVATE_KEY!;

    const token = jwt.sign(
        {
            iss: teamId,
            sub: serviceId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        },
        privateKey,
        {
            algorithm: 'ES256',
            keyid: keyId
        }
    );

    return token;
}
