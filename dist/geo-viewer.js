// Interactive satellite footprint. The SVG atlas remains available if WebGL or map tiles fail.
window.geoViewer = (() => {
  let map = null;
  let stage = null;
  let markers = [];
  let bindToken = 0;
  let terrainFailed = false;
  let imageryErrors = 0;

  function dispose() {
    bindToken++;
    markers.forEach(marker => marker.remove());
    markers = [];
    if (map) { map.remove(); map = null; }
    stage = null;
  }

  function regionBounds() {
    const atlas = window.INDIA_MAPS;
    const bounds = selectedMapRegion === 'IN' ? atlas.india.bounds : atlas.regions[selectedMapRegion].bounds;
    return [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]];
  }

  function ensureTerrain() {
    if (!map || terrainFailed) return;
    try {
      if (!map.getSource('elevation')) map.addSource('elevation', {type: 'raster-dem', url: 'https://tiles.mapterhorn.com/tilejson.json'});
      map.setTerrain({source: 'elevation', exaggeration: 1.4});
    } catch (error) {
      terrainFailed = true;
      console.warn('Terrain unavailable', error);
    }
  }

  function frameRegion(animate = false) {
    if (!map) return;
    const india = selectedMapRegion === 'IN';
    map.setProjection({type: 'mercator'});
    map.setPaintProperty('satellite-imagery', 'raster-opacity', india ? 0.13 : 1);
    if (map.getLayer('region-extrusion')) map.setPaintProperty('region-extrusion', 'fill-extrusion-opacity', india ? 1 : 0);
    if (map.getLayer('region-tint')) map.setPaintProperty('region-tint', 'fill-opacity', india ? 0 : 0.045);
    if (india) map.setTerrain(null); else ensureTerrain();
    map.fitBounds(regionBounds(), {
      padding: india ? 24 : 42,
      maxZoom: india ? 4.2 : 8.5,
      pitch: india ? 52 : 43,
      bearing: india ? -11 : -9,
      duration: animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 1100 : 0,
      essential: true
    });
  }

  function routeData() {
    const locations = footprintLocations();
    const selected = locations.find(location => location.key === selectedMapCity);
    if (!selected) return {type: 'FeatureCollection', features: []};
    const clientIds = new Set(selected.clients.keys());
    return {type: 'FeatureCollection', features: locations
      .filter(location => location.key !== selected.key && [...location.clients.keys()].some(id => clientIds.has(id)))
      .map(location => ({type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: [
        [selected.city.lon, selected.city.lat], [location.city.lon, location.city.lat]
      ]}}))};
  }

  function syncSelection() {
    const detail = document.getElementById('map-location-detail');
    if (detail) detail.innerHTML = renderMapCityDetail(selectedMapCity);
    stage?.querySelectorAll('.map-marker').forEach(marker => marker.classList.toggle('is-selected', marker.dataset.mapCity === selectedMapCity));
    stage?.querySelectorAll('.satellite-pin').forEach(marker => marker.classList.toggle('is-selected', marker.dataset.mapCity === selectedMapCity));
    const routeSource = map?.getSource('client-routes');
    if (routeSource) routeSource.setData(routeData());
  }

  function mountMarkers(maplibregl) {
    markers.forEach(marker => marker.remove());
    markers = footprintLocations().map(location => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `satellite-pin${location.key === selectedMapCity ? ' is-selected' : ''}`;
      button.dataset.mapCity = location.key;
      button.setAttribute('aria-label', `${location.key}: ${location.clients.size} clients, ${location.branches.length} branches. Click to zoom and view details.`);
      button.innerHTML = `<span class="satellite-pin-ring"><span class="satellite-pin-count">${location.clients.size}</span></span><span class="satellite-pin-name">${esc(location.key)}</span>`;
      return new maplibregl.Marker({element: button, anchor: 'bottom', offset: [0, 11]})
        .setLngLat([location.city.lon, location.city.lat]).addTo(map);
    });
  }

  function selectCity(key) {
    if (!map || !stage?.classList.contains('is-satellite')) return false;
    const location = footprintLocations().find(item => item.key === key);
    if (!location) return true;
    selectedMapCity = key;
    syncSelection();
    map.setProjection({type: 'mercator'});
    map.setPaintProperty('satellite-imagery', 'raster-opacity', 1);
    if (map.getLayer('region-extrusion')) map.setPaintProperty('region-extrusion', 'fill-extrusion-opacity', 0);
    ensureTerrain();
    map.flyTo({center: [location.city.lon, location.city.lat], zoom: 11.35, pitch: 67, bearing: -24,
      speed: 0.8, curve: 1.6, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1800, essential: true});
    stage.querySelector('.map-view-badge').textContent = `${location.key} · satellite 3D`;
    return true;
  }

  async function bind() {
    dispose();
    stage = document.querySelector('.overview-map .map-stage');
    if (!stage) return;
    const token = bindToken;
    const layer = document.createElement('div');
    layer.className = 'satellite-map';
    layer.setAttribute('aria-label', 'Interactive satellite and terrain map of client locations');
    stage.prepend(layer);
    const badge = document.createElement('span');
    badge.className = 'map-view-badge';
    badge.textContent = 'Loading satellite view…';
    stage.append(badge);
    const loadTimer = setTimeout(() => {
      if (token === bindToken && stage && !stage.classList.contains('is-satellite')) {
        badge.textContent = 'Outline view · satellite unavailable';
      }
    }, 6500);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'map-reset-view';
    reset.dataset.mapResetView = '';
    reset.textContent = '↖ Region view';
    reset.setAttribute('aria-label', 'Return to the selected region view');
    stage.append(reset);

    try {
      const maplibregl = await import('./assets/maplibre-gl.mjs');
      if (token !== bindToken || !stage?.isConnected || view !== 'overview') return;
      terrainFailed = false;
      imageryErrors = 0;
      map = new maplibregl.Map({
        container: layer,
        center: selectedMapRegion === 'IN' ? [79.4, 22.3] : [76.7, 19.1],
        zoom: selectedMapRegion === 'IN' ? 3.4 : 5.9,
        pitch: selectedMapRegion === 'IN' ? 52 : 43,
        bearing: selectedMapRegion === 'IN' ? -11 : -9,
        maxZoom: 15,
        maxPitch: 85,
        attributionControl: true,
        style: {
          version: 8,
          projection: {type: 'mercator'},
          sources: {
            satellite: {
              type: 'raster',
              tiles: ['https://tiles.versatiles.org/tiles/satellite/{z}/{x}/{y}'],
              tileSize: 512, maxzoom: 12,
              attribution: '<a href="https://versatiles.org/sources/" target="_blank" rel="noopener noreferrer">© VersaTiles imagery sources</a>'
            }
          },
          layers: [
            {id: 'map-background', type: 'background', paint: {'background-color': '#082c24'}},
            {id: 'satellite-imagery', type: 'raster', source: 'satellite', paint: {'raster-opacity': selectedMapRegion === 'IN' ? 0.13 : 1}}
          ]
        }
      });
      map.addControl(new maplibregl.NavigationControl({visualizePitch: true, showZoom: true, showCompass: true}), 'top-right');
      map.on('error', event => {
        const source = event.sourceId || event.source?.id || '';
        if (source === 'elevation' && !terrainFailed) {
          terrainFailed = true;
          try { map.setTerrain(null); } catch (_) {}
          if (stage) stage.querySelector('.map-view-badge').textContent = 'Satellite view · terrain unavailable';
        }
        if (source === 'satellite' && ++imageryErrors >= 3 && stage) {
          stage.classList.remove('is-satellite');
          stage.querySelector('.map-view-badge').textContent = 'Outline view · satellite unavailable';
        }
      });
      map.on('load', () => {
        if (token !== bindToken || !stage?.isConnected) return;
        clearTimeout(loadTimer);
        stage.classList.add('is-satellite');
        badge.textContent = selectedMapRegion === 'IN' ? 'India · 3D client map' : 'Satellite view';
        try {
        const all = window.INDIA_BOUNDARIES;
        if (all) {
          const withCounts = {type: 'FeatureCollection', features: all.features.map(feature => ({
            ...feature,
            properties: {...feature.properties, clientCount: footprintLocations()
              .filter(location => location.city.state === feature.properties.code)
              .reduce((sum, location) => sum + location.clients.size, 0)}
          }))};
          const data = selectedMapRegion === 'IN' ? withCounts : {
            type: 'FeatureCollection', features: all.features.filter(feature => feature.properties.code === selectedMapRegion)
          };
          map.addSource('regions', {type: 'geojson', data,
            attribution: '<a href="https://www.geoboundaries.org/" target="_blank" rel="noopener noreferrer">geoBoundaries CC BY 4.0</a>'});
          map.addLayer({id: 'region-tint', type: 'fill', source: 'regions',
            paint: {'fill-color': '#9fef9b', 'fill-opacity': selectedMapRegion === 'IN' ? 0 : 0.045}});
          if (selectedMapRegion === 'IN') map.addLayer({id: 'region-extrusion', type: 'fill-extrusion', source: 'regions',
            paint: {
              'fill-extrusion-color': ['case', ['>', ['get', 'clientCount'], 0], '#23815e', '#356154'],
              'fill-extrusion-height': ['case', ['>', ['get', 'clientCount'], 0], 105000, 78000],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 1,
              'fill-extrusion-vertical-gradient': true
            }});
          map.addLayer({id: 'region-edge', type: 'line', source: 'regions',
            paint: {'line-color': selectedMapRegion === 'IN' ? ['case', ['>', ['get', 'clientCount'], 0], '#d6ff9c', '#9dceb0'] : '#c7f36b',
              'line-opacity': 0.92, 'line-width': selectedMapRegion === 'IN' ? 1.4 : 2}});
          if (selectedMapRegion === 'IN') {
            map.on('click', 'region-extrusion', event => {
              if (selectedMapCity || event.originalEvent?.target?.closest?.('.satellite-pin')) return;
              const code = event.features?.[0]?.properties?.code;
              if (code && window.INDIA_MAPS.regions[code]) {
                selectedMapRegion = code;
                selectedMapCity = '';
                queueMicrotask(render);
              }
            });
            map.on('mouseenter', 'region-extrusion', () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', 'region-extrusion', () => { map.getCanvas().style.cursor = ''; });
          }
        }
        map.addSource('client-routes', {type: 'geojson', data: routeData()});
        map.addLayer({id: 'client-route-lines', type: 'line', source: 'client-routes',
          paint: {'line-color': '#c7f36b', 'line-width': 2, 'line-opacity': 0.9, 'line-dasharray': [1.5, 2.5]}});
        mountMarkers(maplibregl);
        if (selectedMapRegion !== 'IN') {
          ensureTerrain();
          badge.textContent = terrainFailed ? 'Satellite view' : 'Satellite · 3D terrain';
        }
        if (selectedMapCity) {
          const location = footprintLocations().find(item => item.key === selectedMapCity);
          if (location) {
            map.setProjection({type: 'mercator'});
            map.setPaintProperty('satellite-imagery', 'raster-opacity', 1);
            if (map.getLayer('region-extrusion')) map.setPaintProperty('region-extrusion', 'fill-extrusion-opacity', 0);
            ensureTerrain();
            map.jumpTo({center: [location.city.lon, location.city.lat], zoom: 11.35, pitch: 67, bearing: -24});
            badge.textContent = `${location.key} · satellite 3D`;
          } else frameRegion(false);
        } else frameRegion(false);
        } catch (error) {
          badge.textContent = 'Satellite view';
          console.warn('Map overlay unavailable', error);
        }
      });
    } catch (error) {
      clearTimeout(loadTimer);
      if (token === bindToken && stage) badge.textContent = 'Outline view · satellite unavailable';
    }
  }

  document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-map-reset-view]')) return;
    selectedMapCity = '';
    if (map && stage?.classList.contains('is-satellite')) {
      syncSelection();
      frameRegion(true);
      stage.querySelector('.map-view-badge').textContent = selectedMapRegion === 'IN' ? 'India · 3D client map' : 'Satellite · 3D terrain';
    } else {
      const section = document.querySelector('.overview-map');
      if (section) { section.outerHTML = renderMaharashtraMap(); bindOverviewMap(); }
    }
  });

  return {bind, dispose, selectCity, getMap: () => map};
})();
