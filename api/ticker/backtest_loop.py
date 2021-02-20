import asyncio
from parameters.enums import SessionDatasetNames
import aiohttp

from janus import Queue


async def backtest(timer, backtest_session, strategy):
    from strategies.monitor_strategy import monitor_strategy_executor
    from utils.timescaledb.tsdb_manage import get_pool
    from utils.sources.select import select_backtest_sources
    from ticker.processing.default_postprocessor import default_postprocessor
    from ticker.processing.process_ticks import write_ticks_to_session_store
    from ticker.sourcing.default_source_loader import default_sources_loader

    timeseries_connection_pool = await get_pool()
    # scheduler: aiojobs.Scheduler = await aiojobs.create_scheduler()
    session = aiohttp.ClientSession()
    sources = select_backtest_sources(backtest_session)

    source_q = Queue()
    ticks_to_write_q = Queue()
    processing_q = Queue()
    dataset_name = (
        SessionDatasetNames.test
        if backtest_session.backtest_type == "test"
        else SessionDatasetNames.backtest
    )
    coros = [
        default_sources_loader(sources, [ticks_to_write_q], session, timer),
        write_ticks_to_session_store(
            dataset_name,
            timeseries_connection_pool,
            backtest_session.id,
            ticks_to_write_q,
            source_q,
        ),
        monitor_strategy_executor(
            dataset_name,
            timeseries_connection_pool,
            backtest_session.id,
            source_q,
            processing_q,
        ),
        default_postprocessor(
            dataset_name,
            timeseries_connection_pool,
            backtest_session.id,
            processing_q,
        ),
    ]
    tasks = [asyncio.create_task(x) for x in coros]
    print("============STARTING BACKTEST SESSION=============")
    try:
        await asyncio.wait({*tasks})
    except Exception as e:
        print(e)
    await session.close()
    print("============FINISHED BACKTEST SESSION=============")
