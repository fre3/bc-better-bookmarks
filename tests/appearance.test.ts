import { afterEach, describe, expect, it, vi } from 'vitest';
import { APPEARANCE_KEY, APPEARANCE_CACHE, appearancePreference, readAppearance, saveAppearance, setAppearance, onAppearance, initializeAppearance } from '../src/browser/appearance';

afterEach(() => vi.unstubAllGlobals());
describe('device-local appearance', () => {
  it('defaults unknown/missing preferences to System and preserves overrides', async () => {
    expect(appearancePreference(undefined)).toBe('system'); expect(appearancePreference('invalid')).toBe('system');
    expect(appearancePreference('dark')).toBe('dark'); expect(appearancePreference('light')).toBe('light');
    const local = {get:vi.fn(async()=>({[APPEARANCE_KEY]:'dark'})),set:vi.fn(async()=>undefined)};
    vi.stubGlobal('chrome',{storage:{local}});
    expect(await readAppearance()).toBe('dark'); await saveAppearance('light');
    expect(local.set).toHaveBeenCalledExactlyOnceWith({[APPEARANCE_KEY]:'light'});
  });
  it('uses the worker write path and reports failed persistence', async () => {
    const sendMessage=vi.fn().mockResolvedValueOnce({ok:true}).mockResolvedValueOnce({ok:false,error:'unavailable'});
    vi.stubGlobal('chrome',{runtime:{sendMessage}});
    await setAppearance('dark'); expect(sendMessage).toHaveBeenCalledWith({event:'set-appearance',appearance:'dark'});
    await expect(setAppearance('light')).rejects.toThrow('unavailable');
  });
  it('observes only appearance in local storage; removal returns System', () => {
    const addListener=vi.fn(),removeListener=vi.fn(),changed=vi.fn();
    vi.stubGlobal('chrome',{storage:{onChanged:{addListener,removeListener}}});
    const stop=onAppearance(changed), listener=addListener.mock.calls[0][0];
    listener({[APPEARANCE_KEY]:{newValue:'dark'}},'sync'); listener({other:{}},'local'); expect(changed).not.toHaveBeenCalled();
    listener({[APPEARANCE_KEY]:{newValue:'light'}},'local'); expect(changed).toHaveBeenLastCalledWith('light');
    listener({[APPEARANCE_KEY]:{}},'local'); expect(changed).toHaveBeenLastCalledWith('system');
    stop(); expect(removeListener).toHaveBeenCalledWith(listener);
  });
  it('does not let a slow initial read overwrite a newer tab selection', async () => {
    let resolve!: (value: unknown) => void;
    const addListener=vi.fn(),setItem=vi.fn(),dataset:Record<string,string>={};
    vi.stubGlobal('document',{documentElement:{dataset}}); vi.stubGlobal('localStorage',{setItem});
    vi.stubGlobal('chrome',{storage:{local:{get:()=>new Promise(r=>{resolve=r;})},onChanged:{addListener}}});
    const ready=initializeAppearance();
    addListener.mock.calls[0][0]({[APPEARANCE_KEY]:{newValue:'dark'}},'local');
    resolve({[APPEARANCE_KEY]:'light'}); await ready;
    expect(dataset.appearance).toBe('dark'); expect(setItem).toHaveBeenCalledExactlyOnceWith(APPEARANCE_CACHE,'dark');
  });
  it('keeps usable startup colors when storage or cache access is denied', async () => {
    const dataset={appearance:'light'}; vi.stubGlobal('document',{documentElement:{dataset}});
    vi.stubGlobal('localStorage',{setItem:()=>{throw Error('blocked');}});
    vi.stubGlobal('chrome',{storage:{local:{get:vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce({[APPEARANCE_KEY]:'dark'})},onChanged:{addListener:vi.fn()}}});
    await initializeAppearance(); expect(dataset.appearance).toBe('light');
    await initializeAppearance(); expect(dataset.appearance).toBe('dark');
  });
});
