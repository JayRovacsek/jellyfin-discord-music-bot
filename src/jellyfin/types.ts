export type SearchHint = {
    ItemId: string,
    Id: string,
    Name: string,
    IndexNumber: number,
    ProductionYear: number,
    ParentIndexNumber: number,
    BackdropImageTag: string,
    BackdropImageItemId: string,
    Type: string,
    RunTimeTicks: number,
    MediaType: string,
    Album: string,
    AlbumId: string,
    AlbumArtist: string,
    Artists: string[],
    ChannelId: string,
    ServerId: undefined | string,
}

export type SearchResult = {
    SearchHints: SearchHint[],
    TotalRecordCount: number
}

type SearchableMediaOption = {
    title: string,
    searchTerm: string,
    aliases: string[]
}

// Need to identify mappings in upstream identifiers for this stuff.
// Likely starting space: https://github.com/jellyfin/jellyfin/blob/aa93774b29193680799979c9c94bbb5ae2316a8a/Emby.Server.Implementations/Library/SearchEngine.cs#L33
export const SearchableMedia: SearchableMediaOption[] = [
  {
    title: 'Track',
    searchTerm: 'Audio',
    aliases: ['--track', '--t']
  },
  {
    title: 'Album',
    searchTerm: 'MusicAlbum',
    aliases: ['--album']
  },
  {
    title: 'Artist',
    searchTerm: 'MusicArtist',
    aliases: ['--artist']
  },
  {
    title: 'Genre',
    searchTerm: 'Genre',
    aliases: ['--genre']
  },
  {
    title: 'Playlist',
    searchTerm: 'Playlist',
    aliases: ['--playlist']
  }
]
