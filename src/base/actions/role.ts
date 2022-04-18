import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('roleUpdate', (oldRole, newRole) => {
        if (oldRole.rawPosition !== newRole.rawPosition) {
            /**
             * Emitted when a role's position is updated.
             * @event DiscomClient#rolePositionUpdate
             * @param {Role} role The role that had its position updated
             * @param {number} oldPosition The old position
             * @param {number} newPosition The new position
             * @example client.on('rolePositionUpdate', (role, oldPosition, newPosition) => {
             * console.log(`${role.name}'s position was updated`);
             * });
             */
            client.emit('rolePositionUpdate',
                newRole,
                oldRole.rawPosition,
                newRole.rawPosition,
            );
        }

        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            /**
             * Emitted when a role's permissions are updated.
             * @event DiscomClient#rolePermissionsUpdate
             * @param {Role} role The role that had its permissions updated
             * @param {PermissionResolvable} oldPermissions The old permissions
             * @param {PermissionResolvable} newPermissions The new permissions
             * @example client.on('rolePermissionsUpdate', (role, oldPermissions, newPermissions) => {
             * console.log(`${role.name}'s permissions were updated`);
             * });
             */
            client.emit('rolePermissionsUpdate',
                newRole,
                oldRole.permissions.bitfield,
                newRole.permissions.bitfield,
            );
        }
    });
};
