import SpotifyWebApi from 'spotify-web-api-node';
import config from '../../config.json' assert { type: 'json' };

class SpotifyService {
    constructor() {
        this.spotify = new SpotifyWebApi({
            clientId: config.spotify.clientId,
            clientSecret: config.spotify.clientSecret
        });
        
        this.isAuthenticated = false;
        this.tokenExpiry = null;
        
        if (config.spotify.clientId && config.spotify.clientSecret) {
            this.authenticate();
        }
    }

    async authenticate() {
        try {
            const data = await this.spotify.clientCredentialsGrant();
            
            this.spotify.setAccessToken(data.body.access_token);
            this.tokenExpiry = Date.now() + (data.body.expires_in * 1000);
            this.isAuthenticated = true;
            
            console.log('✅ Spotify API authenticated successfully');
            return true;
        } catch (error) {
            console.error('❌ Spotify authentication failed:', error.message);
            this.isAuthenticated = false;
            return false;
        }
    }

    async ensureAuthenticated() {
        if (!this.isAuthenticated || Date.now() >= this.tokenExpiry) {
            return await this.authenticate();
        }
        return true;
    }

    isSpotifyUrl(url) {
        return /^https?:\/\/(open\.)?spotify\.com\//i.test(url);
    }

    parseSpotifyUrl(url) {
        const regex = /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        
        if (match) {
            return {
                type: match[1],
                id: match[2]
            };
        }
        
        return null;
    }

    async getTrack(trackId) {
        if (!await this.ensureAuthenticated()) return null;
        
        try {
            const data = await this.spotify.getTrack(trackId);
            const track = data.body;
            
            return {
                name: track.name,
                artists: track.artists.map(artist => artist.name),
                duration: track.duration_ms,
                url: track.external_urls.spotify,
                image: track.album.images[0]?.url,
                searchQuery: `${track.artists[0].name} ${track.name}`
            };
        } catch (error) {
            console.error('❌ Error fetching Spotify track:', error.message);
            return null;
        }
    }

    async getAlbum(albumId) {
        if (!await this.ensureAuthenticated()) return null;
        
        try {
            const data = await this.spotify.getAlbum(albumId);
            const album = data.body;
            
            const tracks = album.tracks.items.map(track => ({
                name: track.name,
                artists: track.artists.map(artist => artist.name),
                duration: track.duration_ms,
                searchQuery: `${track.artists[0].name} ${track.name}`
            }));
            
            return {
                name: album.name,
                artists: album.artists.map(artist => artist.name),
                totalTracks: album.total_tracks,
                url: album.external_urls.spotify,
                image: album.images[0]?.url,
                tracks: tracks
            };
        } catch (error) {
            console.error('❌ Error fetching Spotify album:', error.message);
            return null;
        }
    }

    async getPlaylist(playlistId) {
        if (!await this.ensureAuthenticated()) return null;
        
        try {
            const data = await this.spotify.getPlaylist(playlistId);
            const playlist = data.body;
            
            const tracks = playlist.tracks.items
                .filter(item => item.track && item.track.type === 'track')
                .map(item => ({
                    name: item.track.name,
                    artists: item.track.artists.map(artist => artist.name),
                    duration: item.track.duration_ms,
                    searchQuery: `${item.track.artists[0].name} ${item.track.name}`
                }));
            
            return {
                name: playlist.name,
                description: playlist.description,
                owner: playlist.owner.display_name,
                totalTracks: playlist.tracks.total,
                url: playlist.external_urls.spotify,
                image: playlist.images[0]?.url,
                tracks: tracks
            };
        } catch (error) {
            console.error('❌ Error fetching Spotify playlist:', error.message);
            return null;
        }
    }

    async searchTracks(query, limit = 10) {
        if (!await this.ensureAuthenticated()) return [];
        
        try {
            const data = await this.spotify.searchTracks(query, { limit });
            
            return data.body.tracks.items.map(track => ({
                name: track.name,
                artists: track.artists.map(artist => artist.name),
                duration: track.duration_ms,
                url: track.external_urls.spotify,
                image: track.album.images[0]?.url,
                searchQuery: `${track.artists[0].name} ${track.name}`,
                popularity: track.popularity
            }));
        } catch (error) {
            console.error('❌ Error searching Spotify tracks:', error.message);
            return [];
        }
    }

    async getArtist(artistId) {
        if (!await this.ensureAuthenticated()) return null;
        
        try {
            const data = await this.spotify.getArtist(artistId);
            const artist = data.body;
            
            return {
                name: artist.name,
                genres: artist.genres,
                popularity: artist.popularity,
                followers: artist.followers.total,
                url: artist.external_urls.spotify,
                image: artist.images[0]?.url
            };
        } catch (error) {
            console.error('❌ Error fetching Spotify artist:', error.message);
            return null;
        }
    }

    async getArtistTopTracks(artistId, limit = 20) {
        if (!await this.ensureAuthenticated()) return [];
        
        try {
            // Get top tracks for the artist (country code 'US' for broader selection)
            const data = await this.spotify.getArtistTopTracks(artistId, 'US');
            
            const tracks = data.body.tracks.slice(0, limit).map(track => ({
                name: track.name,
                artists: track.artists.map(artist => artist.name),
                duration: track.duration_ms,
                url: track.external_urls.spotify,
                image: track.album.images[0]?.url,
                searchQuery: `${track.artists[0].name} ${track.name}`,
                popularity: track.popularity,
                album: track.album.name
            }));
            
            return tracks;
        } catch (error) {
            console.error('❌ Error fetching artist top tracks:', error.message);
            return [];
        }
    }

    async getRecommendations(seedTrackId, limit = 10) {
        if (!await this.ensureAuthenticated()) return [];
        
        try {
            const data = await this.spotify.getRecommendations({
                seed_tracks: [seedTrackId],
                limit: limit
            });
            
            return data.body.tracks.map(track => ({
                name: track.name,
                artists: track.artists.map(artist => artist.name),
                duration: track.duration_ms,
                url: track.external_urls.spotify,
                image: track.album.images[0]?.url,
                searchQuery: `${track.artists[0].name} ${track.name}`
            }));
        } catch (error) {
            console.error('❌ Error getting Spotify recommendations:', error.message);
            return [];
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

export default new SpotifyService();
