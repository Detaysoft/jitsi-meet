// @flow

import { MiddlewareRegistry, set } from '../base/redux';

import { CONNECTION_FAILED, getCurrentConnection } from '../base/connection';
import { CONFERENCE_FAILED, getCurrentConference } from '../base/conference';
import { LOAD_CONFIG_ERROR } from '../base/config';
import { setFatalErrorOccurred } from './actions';
import { FATAL_ERROR_OCCURRED } from './actionTypes';

/**
 * The redux middleware to set the visibility of {@link SettingsView}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register2(store => next => action => {
    switch (action.type) {
    case LOAD_CONFIG_ERROR: {
        // In contrary to connection and conference failure events only
        // the relevant ones are emitted for the config feature.
        return _maybeFatalErrorOccurred(store, next, action);
    }
    case CONNECTION_FAILED: {
        const { connection } = action;
        const currentConnection = getCurrentConnection(store);

        if (connection === currentConnection) {
            return _maybeFatalErrorOccurred(store, next, action);
        }
        break;
    }
    case CONFERENCE_FAILED: {
        const { conference } = action;
        const currentConference = getCurrentConference(store);

        if (conference === currentConference) {
            return _maybeFatalErrorOccurred(store, next, action);
        }
        break;
    }
    case FATAL_ERROR_OCCURRED: {
        const state = store.getState();

        // Reemit the original action whcih caused the reload screen to appear
        // with recoverable flag set to 'false'.
        if (!action.fatalErrorOccurred) {
            const { fatalErrorCause } = state['features/overlay'];

            if (fatalErrorCause) {
                const toDispatch
                    = set(fatalErrorCause,
                    'error',
                    set(fatalErrorCause.error, 'recoverable', false));

                console.info('Will dispatch', fatalErrorCause.type);
                store.dispatch(toDispatch);
            } else {
                console.info('NO FATAL ERROR CAUSE');
            }
        }
    }
    }

    return next(action);
});

/**
 * Hides {@link SettingsView}.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function.
 * @param {Action} action - The redux action.
 * @private
 * @returns {Object} The new state.
 */
function _maybeFatalErrorOccurred({ dispatch }, next, action) {
    const { error } = action;

    if (typeof error.recoverable === 'undefined') {
        error.recoverable = true;
        dispatch(setFatalErrorOccurred(true, action));
    }

    return next(action);
}
