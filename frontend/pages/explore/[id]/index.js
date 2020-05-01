import React from 'react';
import { useRouter } from 'next/router';
import useSWR, { cache } from 'swr';
import { observer } from 'mobx-react';
import Chart from "react-google-charts";
import Card from '@material-ui/core/Card';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import { useStores } from 'components/rootStore';
import TableLayout from 'components/layouts/TableLayout';
import f from 'api/frontendRoutes';
import b from 'api/backendRoutes';


const dataHeader = [
    { type: 'string', id: 'IntervalName' },
    { type: 'date', id: 'Start' },
    { type: 'date', id: 'End' },
];

const initial = [
    dataHeader,
    [ 'Available Data', new Date(2018, 8, 30), new Date(2018, 12, 4) ],
    [ 'Available Data', new Date(2019, 2, 4),  new Date(2019, 4, 4) ]
];

function ExploreSource() {
    const { sourcesStore } = useStores();
    const router = useRouter();
    const initialData = cache.get(b.SOURCES)?.find(c => c.id === parseInt(router.query.id));
    const { data, error, mutate } = useSWR(
        `${b.SOURCES}/${router.query.id}`,
        async (query) => {
            return await sourcesStore.detail(router.query.id);
        },
        {
            initialData
        }
    );
    const rows = data?.available_intervals?.map(i => ['Availability:', new Date(i[0]), new Date(i[1])]) || [[ 'Loading...', new Date(2010, 1, 1), new Date(2010, 1, 2) ]];
    const chartData = [
        dataHeader,
        ...rows
    ];
    return (
        <TableLayout
            title={data?.id}
            toolbar={() => (
                <IconButton
                    edge="start"
                    component="a"
                    onClick={() => router.push(f.EXPLORE)}
                    color="inherit"
                    aria-label="back to"
                >
                <ArrowBackIcon />
                </IconButton>
            )}
        >
            <Paper>
                <Container maxWidth="sm">
                    <Box py={4}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {data?.type}
                        </Typography>
                    </Box>
                </Container>
                <Card>
                    <Chart
                        chartType="Timeline"
                        height="600px"
                        data={chartData}
                        options={{
                            showRowNumber: true,
                        }}
                        rootProps={{ 'data-testid': '1' }}
                    />
                    <Card>
                    {JSON.stringify(data)}
                    </Card>
                    <Card>
                    [{JSON.stringify(cache.get(b.SOURCES))}]
                    </Card>
                    <Card>
                    {JSON.stringify(data)}
                    </Card>
                </Card>
            </Paper>
        </TableLayout>
    );
}

export default observer(ExploreSource);
