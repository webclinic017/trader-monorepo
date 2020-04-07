import React from 'react';
import { useMemo, useEffect } from 'react';
import App from 'next/app';
import Head from 'next/head';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import auth0 from '../lib/auth0'
import Layout from '../components/layout'
import theme from '../src/theme';
import { RootStore, StoreProvider } from '../components/rootStore';


export default function MyApp({ Component, pageProps }) {
    const store = useMemo(() => {
        return new RootStore();
    }, []);

    useEffect(() => {
        // Remove the server-side injected CSS.
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles) {
          jssStyles.parentElement.removeChild(jssStyles);
        }
    }, []);

    useEffect(() => {
        // If your page has Next.js data fetching methods returning a state for the Mobx store,
        // then you can hydrate it here.
        const { initialState } = pageProps;
        if (initialState) {
            store.hydrate(initialState);
        }
    }, [store.sourcesStore, pageProps]);

    useEffect(() => {
        store.authStore.start();
        return store.authStore.stop;
    }, [])

    return (
        <>
            <Head>
                <title>My page</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
            </Head>
            <ThemeProvider theme={theme}>
            <StyledThemeProvider theme={theme}>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                <Layout>
                <StoreProvider store={store}>
                    <Component {...pageProps} />
                </StoreProvider>
                </Layout>
            </StyledThemeProvider>
            </ThemeProvider>
        </>
    );
};


// MyApp.getInitialProps = async ( { ctx } ) => {
//     const isServer = (typeof window === 'undefined');
//     console.log(`GetInitialProps on ${isServer ? 'server!' : 'browser!'}`);
//     if (isServer) {
//         debugger;
//         const session = await auth0.getSession(ctx.req);
//         debugger;
//         console.log(session);
//     }

//     const appProps = await App.getInitialProps(ctx);
//     let initialState;
//     if (isServer) {
//         initialState = {
//             usersStore: {
//                 state: "non-fetched",
//                 users: ['kek', 'shmek', 'userek']
//             },
//             sourcesStore: {
//                 state: "non-fetched",
//                 sources: ['kek', 'shmek', 'sourcerek']
//             },
//             authStore: {
//                 state: "fetched",
//                 user: ctx.user
//             }
//         };
//     }
//     return {
//         ...appProps,
//         pageProps: {
//             ...appProps.pageProps,
//             initialState
//         }
//     };
// };

MyApp.getInitialProps = async (appContext) => {
    const isServer = (typeof window === 'undefined')
    console.log(`[_app.js] GetInitialProps on ${isServer ? 'server!' : 'browser!'}`);
    if (isServer) {
        const session = await auth0.getSession(appContext.ctx.req);
        appContext.ctx.user = session?.user;
    }
    console.log(appContext.ctx.user);
    const appProps = await App.getInitialProps(appContext);
    let initialState;
    if (isServer) {
        initialState = {
            usersStore: {
                state: "non-fetched",
                users: ['kek', 'shmek', 'userek']
            },
            sourcesStore: {
                state: "non-fetched",
                sources: ['kek', 'shmek', 'sourcerek']
            },
            authStore: {
                state: "fetched",
                user: appContext.ctx.user
            }
        };
    }
    return {
        ...appProps,
        pageProps: {
            ...appProps.pageProps,
            initialState
        }
    };
};
