'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import YouTube from 'react-youtube';
import apiConfig from "@/configs/apiConfig";

const FloatingMusicWidget = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const [playerKey, setPlayerKey] = useState(0);
    const [playlist, setPlaylist] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(-1);
    const [playerType, setPlayerType] = useState('video');

    const playerRef = useRef(null);
    const openCardRef = useRef(null);
    const timeUpdateInterval = useRef(null);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
        };
    }, [isOpen]);

    const showToast = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const searchYouTube = async () => {
        if (!searchQuery.trim()) {
            showToast("Masukkan kata kunci pencarian!", 'warn');
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`https://${apiConfig.DOMAIN_URL}/api/search/youtube/v4?action=search&query=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data.code?.error === "00000" && data.data?.items) {
                const results = data.data.items.map(item => ({
                    id: item.id,
                    title: item.title,
                    thumbnail: item.thumbnail,
                    duration: item.duration,
                    creator: item.creator,
                    viewCount: item.viewCount,
                    publishedAt: item.publishedAt
                }));
                setSearchResults(results);
                showToast(`Ditemukan ${results.length} video!`, 'success');
            } else {
                showToast("Tidak ada hasil ditemukan", 'warn');
                setSearchResults([]);
            }
        } catch (error) {
            showToast("Error saat mencari video", 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const playSong = useCallback((item, index) => {
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = null;
        }

        if (playerRef.current) {
            try {
                playerRef.current.stopVideo();
            } catch (error) {
                console.log('Error stopping video:', error);
            }
        }

        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setCurrentSong(item);
        setCurrentSongIndex(index);
        setPlayerKey(prev => prev + 1);
        showToast(`Memutar: ${item.title}`, 'success');
    }, []);

    const selectSearchResult = (item) => {
        const newPlaylist = [...searchResults];
        const index = newPlaylist.findIndex(song => song.id === item.id);
        playSong(item, index);
        setPlaylist(newPlaylist);
    };

    const togglePlayPause = () => {
        if (!currentSong) {
            showToast("Pilih video terlebih dahulu!", 'warn');
            return;
        }

        if (playerRef.current) {
            try {
                const state = playerRef.current.getPlayerState();
                if (state === 1) {
                    playerRef.current.pauseVideo();
                } else {
                    playerRef.current.playVideo();
                }
            } catch (error) {
                showToast("Error saat kontrol player", 'error');
            }
        }
    };

    const playNextSong = () => {
        if (playlist.length === 0) return;
        const nextIndex = (currentSongIndex + 1) % playlist.length;
        playSong(playlist[nextIndex], nextIndex);
    };

    const playPreviousSong = () => {
        if (playlist.length === 0) return;
        const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        playSong(playlist[prevIndex], prevIndex);
    };

    const handleSeekChange = useCallback((event) => {
        const newTime = parseFloat(event.target.value);
        setCurrentTime(newTime);
        if (playerRef.current) {
            try {
                playerRef.current.seekTo(newTime, true);
            } catch (error) {
                console.log('Error seeking:', error);
            }
        }
    }, []);

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPlayerOpts = () => {
        const baseOpts = {
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                showinfo: 0
            },
        };

        return playerType === 'audio' 
            ? { ...baseOpts, height: '0', width: '0' }
            : { ...baseOpts, height: '200', width: '100%' };
    };

    const onPlayerReady = (event) => {
        playerRef.current = event.target;
        try {
            const duration = event.target.getDuration();
            setDuration(duration);
            setIsPlaying(true);
            
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
            
            timeUpdateInterval.current = setInterval(() => {
                if (playerRef.current) {
                    try {
                        const currentTime = playerRef.current.getCurrentTime();
                        setCurrentTime(currentTime);
                    } catch (error) {
                        console.log('Error getting time:', error);
                    }
                }
            }, 1000);
        } catch (error) {
            console.log('Error setup player:', error);
        }
    };

    const onPlayerStateChange = (event) => {
        if (event.data === 0) {
            setIsPlaying(false);
            setCurrentTime(0);
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
                timeUpdateInterval.current = null;
            }
            playNextSong();
        } else if (event.data === 1) {
            setIsPlaying(true);
        } else if (event.data === 2) {
            setIsPlaying(false);
        }
    };

    const onPlayerError = (event) => {
        setIsPlaying(false);
        showToast("Error saat memutar video", 'error');
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = null;
        }
    };

    return (
        <>
            {toastMessage && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white text-sm max-w-sm ${
                    toastType === 'success' ? 'bg-emerald-500' :
                    toastType === 'error' ? 'bg-red-500' :
                    toastType === 'warn' ? 'bg-yellow-500' : 'bg-sky-500'
                }`}>
                    {toastMessage}
                </div>
            )}

            {!isOpen && (
                <div className="fixed right-0 z-50 transition-all duration-300" style={{ top: 'calc(100vh / 12 * 2.5)' }}>
                    <div className="flex flex-col space-y-2">
                        <div
                            className="relative w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-l-xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-l-2 border-t-2 border-b-2 border-teal-300 cursor-pointer"
                            onClick={() => setIsOpen(true)}
                        >
                            <Icon icon="mdi:music" className="text-xl text-white" />
                            {(isPlaying || currentSong) && (
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            )}
                        </div>
                        <div
                            className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-l-xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-l-2 border-t-2 border-b-2 border-blue-300 cursor-pointer"
                            onClick={() => router.push('/try-it')}
                        >
                            <Icon icon="mdi:play-circle" className="text-xl text-white" />
                        </div>
                    </div>
                </div>
            )}

            {isOpen && (
                <div
                    ref={openCardRef}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => {
                        if (openCardRef.current === e.target) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-teal-500/30 dark:border-teal-600/50 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                                        <Icon icon="mdi:music" className="text-lg text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Music Player</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">YouTube Music</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                        <button
                                            onClick={() => setPlayerType('audio')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 ${
                                                playerType === 'audio'
                                                    ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400'
                                                    : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            <Icon icon="mdi:music" className="w-3 h-3" />
                                            <span>Audio</span>
                                        </button>
                                        <button
                                            onClick={() => setPlayerType('video')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 ${
                                                playerType === 'video'
                                                    ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400'
                                                    : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            <Icon icon="mdi:video" className="w-3 h-3" />
                                            <span>Video</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                    >
                                        <Icon icon="mdi:close" className="text-xl text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari lagu atau artis..."
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-200"
                                    onKeyPress={(e) => e.key === 'Enter' && searchYouTube()}
                                />
                                <button
                                    onClick={searchYouTube}
                                    disabled={isSearching}
                                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    {isSearching ? 'Cari...' : 'Cari'}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {searchResults.map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => selectSearchResult(item)}
                                            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                                currentSong?.id === item.id
                                                    ? 'bg-teal-100 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-600'
                                                    : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
                                            }`}
                                        >
                                            <img
                                                src={item.thumbnail}
                                                alt={item.title}
                                                className="w-12 h-9 rounded object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                    {item.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {item.creator} • {item.duration}
                                                </p>
                                            </div>
                                            {currentSong?.id === item.id && (
                                                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentSong && (
                                <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={currentSong.thumbnail}
                                            alt={currentSong.title}
                                            className="w-12 h-12 rounded object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                {currentSong.title}
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                {currentSong.creator}
                                            </div>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                    </div>

                                    {playerType === 'video' && (
                                        <div className="mt-3">
                                            <YouTube
                                                key={playerKey}
                                                videoId={currentSong.id}
                                                opts={getPlayerOpts()}
                                                onReady={onPlayerReady}
                                                onStateChange={onPlayerStateChange}
                                                onError={onPlayerError}
                                                className="w-full rounded-lg overflow-hidden"
                                            />
                                        </div>
                                    )}

                                    {playerType === 'audio' && (
                                        <div style={{ display: 'none' }}>
                                            <YouTube
                                                key={playerKey}
                                                videoId={currentSong.id}
                                                opts={getPlayerOpts()}
                                                onReady={onPlayerReady}
                                                onStateChange={onPlayerStateChange}
                                                onError={onPlayerError}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration}
                                            step="0.1"
                                            value={currentTime}
                                            onChange={handleSeekChange}
                                            className="w-full h-2 rounded-full appearance-none bg-slate-300 dark:bg-slate-700 cursor-pointer"
                                            style={{ background: `linear-gradient(to right, #14b8a6 ${(currentTime / duration) * 100}%, #cbd5e1 ${(currentTime / duration) * 100}%)` }}
                                        />
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-center items-center mt-4 space-x-4">
                                        <button
                                            onClick={playPreviousSong}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                        >
                                            <Icon icon="mdi:skip-previous" className="text-2xl" />
                                        </button>
                                        <button
                                            onClick={togglePlayPause}
                                            className="p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-colors shadow-md"
                                        >
                                            <Icon icon={isPlaying ? "mdi:pause" : "mdi:play"} className="text-2xl" />
                                        </button>
                                        <button
                                            onClick={playNextSong}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                        >
                                            <Icon icon="mdi:skip-next" className="text-2xl" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingMusicWidget;