import json
import logging
import pytz
import asyncpg
from typing import List
from parameters.enums import SessionDatasetNames
from utils.schemas.dataflow_schemas import (
    IndicatorSchema,
    SignalSchema,
    TickSchema,
    TimeseriesSchema,
)


logger = logging.getLogger(__name__)


async def write_indicators(
    dataset_name: SessionDatasetNames,
    pool,
    session_id: int,
    indicators: List[IndicatorSchema],
) -> None:
    for indicator in indicators:
        indicator_tuples = []
        for datapoint in indicator.indicator:
            datapoint: TimeseriesSchema
            values = (
                datapoint.timestamp,
                session_id,
                indicator.label,
                datapoint.value,
            )
            indicator_tuples.append(values)
        async with pool.acquire() as conn:
            try:
                await conn.executemany(
                    f"""
                    INSERT INTO {dataset_name}_indicators(timestamp, session_id, label, value)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (timestamp, session_id, label) DO UPDATE
                    SET value=EXCLUDED.value;
                """,
                    indicator_tuples,
                )
            except asyncpg.exceptions.UniqueViolationError:
                pass


async def write_signals(
    dataset_name: SessionDatasetNames,
    pool,
    session_id: int,
    signals: List[SignalSchema],
) -> None:
    prepared_signals = []
    for signal in signals:
        values = (
            signal.timestamp,
            session_id,
            signal.direction,
            signal.value,
            json.dumps(signal.traceback),
        )
        prepared_signals.append(values)
    async with pool.acquire() as conn:
        try:
            await conn.executemany(
                f"""
                INSERT INTO {dataset_name}_signals(timestamp, session_id, direction, value, traceback)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (timestamp, session_id, label) DO UPDATE
                SET value=EXCLUDED.value,
                    direction=EXCLUDED.direction,
                    traceback=EXCLUDED.traceback;
            """,
                prepared_signals,
            )
        except asyncpg.exceptions.UniqueViolationError:
            logger.warning("UniqueViolationError on signals write to TimescaleDB")


async def write_ticks(
    dataset_name: SessionDatasetNames,
    session_id,
    data_type,
    label,
    ticks: List[TickSchema],
    pool,
):
    prepared_ticks = []
    for tick in ticks:
        timestamp = tick.timestamp.replace(tzinfo=pytz.UTC)
        values = (
            timestamp,
            session_id,
            data_type,
            label,
            tick.price,
            tick.volume,
            tick.funds,
        )
        prepared_ticks.append(values)

    async with pool.acquire() as conn:
        try:
            await conn.executemany(
                f"""
                INSERT INTO {dataset_name}_ticks(timestamp, session_id, data_type, label, price, volume, funds)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (timestamp, session_id, data_type, label) DO UPDATE
                SET price=EXCLUDED.price,
                    volume=EXCLUDED.volume,
                    funds=EXCLUDED.funds;
            """,
                prepared_ticks,
            )
        except asyncpg.exceptions.UniqueViolationError:
            pass