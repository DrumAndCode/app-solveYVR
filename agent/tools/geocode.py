"""Geocode tool: address → WGS84 lat/lng + Web Mercator (EPSG:3857) for Van311."""

from __future__ import annotations

import json
import math
from typing import Any

from geopy.geocoders import Nominatim

from .registry import ToolRegistry


def _to_web_mercator(lat: float, lng: float) -> tuple[float, float]:
    """Convert WGS84 lat/lng to Web Mercator (EPSG:3857) x/y metres."""
    x = lng * 20037508.34 / 180.0
    lat_rad = math.log(math.tan((90.0 + lat) * math.pi / 360.0))
    y = lat_rad * 20037508.34 / math.pi
    return x, y


def register_geocode_tools(registry: ToolRegistry) -> None:
    """Register `geocode_address`: street address → coordinates for Van311 POST fields."""

    geocoder = Nominatim(user_agent="solveyvr-agent/0.1", timeout=10)

    def geocode_address(address: str) -> str:
        if not address or not address.strip():
            return json.dumps({"error": "address_required"})

        query = address.strip()
        if "vancouver" not in query.lower():
            query += ", Vancouver, BC, Canada"

        try:
            location = geocoder.geocode(query, exactly_one=True, addressdetails=True)
        except Exception as e:
            return json.dumps({"error": "geocode_failed", "detail": str(e)})

        if location is None:
            return json.dumps({"error": "not_found", "address": address})

        lat = location.latitude
        lng = location.longitude
        merc_x, merc_y = _to_web_mercator(lat, lng)

        raw = location.raw or {}
        addr_detail = raw.get("address", {})

        out: dict[str, Any] = {
            "input_address": address,
            "display_address": location.address,
            "wgs84": {
                "latitude": lat,
                "longitude": lng,
                "note": "Use for GPSXCoordinate (lng) and GPSYCoordinate (lat).",
            },
            "web_mercator_epsg3857": {
                "x": merc_x,
                "y": merc_y,
                "note": "Use for le_gis_lon (x), le_gis_lat (y), txt_xcoord (x), txt_ycoord (y).",
            },
            "van311_fields": {
                "GPSXCoordinate": str(lng),
                "GPSYCoordinate": str(lat),
                "le_gis_lon": str(merc_x),
                "le_gis_lat": str(merc_y),
                "txt_xcoord": str(merc_x),
                "txt_ycoord": str(merc_y),
                "full-address": location.address,
            },
            "address_details": addr_detail,
        }
        return json.dumps(out, ensure_ascii=False)

    registry.register(
        "geocode_address",
        (
            "Convert a street address to coordinates for the Van311 POST payload. "
            "Returns WGS84 lat/lng (for GPSXCoordinate, GPSYCoordinate) and "
            "Web Mercator EPSG:3857 (for le_gis_lon, le_gis_lat, txt_xcoord, txt_ycoord), "
            "plus a pre-filled `van311_fields` dict ready to merge into the `data` object."
        ),
        {
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": (
                        "Street address to geocode, e.g. '1128 W Broadway, Vancouver'. "
                        "Vancouver is appended automatically if not present."
                    ),
                },
            },
            "required": ["address"],
        },
        geocode_address,
    )
