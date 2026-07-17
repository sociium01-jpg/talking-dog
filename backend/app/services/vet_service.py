# ==============================================================================
# vet_service.py — Global Location-Specific Veterinary Finder Service
# Resolves nearby vet clinics globally (including India) using Overpass OSM API.
# ==============================================================================

import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class VetLocatorService:
    """
    Retrieves real-world veterinary clinics and animal hospitals nearby any location
    using free open-source geolocation nodes (Overpass API).
    """
    
    @staticmethod
    async def find_nearby_vets(lat: float, lng: float, radius_meters: int = 5000) -> List[Dict[str, Any]]:
        """
        Queries Overpass API for veterinary amenities within radius_meters around lat/lng.
        """
        # Query details: Find nodes labeled amenity=veterinary
        overpass_query = (
            f"[out:json];"
            f"node(around:{radius_meters},{lat},{lng})[amenity=veterinary];"
            f"out;"
        )
        url = "https://overpass-api.de/api/interpreter"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, data=overpass_query)
                if response.status_code == 200:
                    data = response.json()
                    elements = data.get("elements", [])
                    results = []
                    
                    for el in elements[:10]:  # Limit to top 10 results
                        tags = el.get("tags", {})
                        name = tags.get("name", "Local Veterinary Clinic")
                        phone = tags.get("phone", tags.get("contact:phone", "N/A"))
                        
                        # Build address from tags
                        street = tags.get("addr:street", "")
                        city = tags.get("addr:city", "")
                        address = f"{street}, {city}".strip(", ")
                        if not address:
                            address = "Nearby Location"
                            
                        results.append({
                            "name": name,
                            "phone": phone,
                            "address": address,
                            "hours": tags.get("opening_hours", "Open Hours Varies"),
                            "lat": el.get("lat"),
                            "lng": el.get("lon"),
                            "distance": f"~{radius_meters // 1000} km"
                        })
                    return results
        except Exception as e:
            logger.error(f"Overpass Vet search failed: {str(e)}")
            
        # Global fallback if query fails
        return []
