import asyncio
import edge_tts
import os

phrases = {
    # === SYSTEM SOUNDS ===
    "startup": "Welcome back, Kenneth! Your desktop is ready.",
    "shutdown": "Are you sure you want to shut down? I'll miss you!",
    "error": "Oops! Something went wrong. But don't worry, I'm here to help!",
    "window_close": "Goodbye, window! See you next time.",
    "logon": "Hello Kenneth! Ready to show off your portfolio?",
    
    # === RANDOM IDLE PHRASES ===
    "welcome": "It looks like you're browsing a portfolio. Would you like help?",
    "meme": "Don't forget to check the Recycle Bin for memes!",
    "double_click": "Double-click an icon to open it.",
    "aarhus": "Aarhus is a great city. Did you know that?",
    "else": "Is there anything else I can do for you?",
    "talent": "Kenneth is an award-winning multimedia creator. Very talented!",
    "navigation": "Need a hand with navigation? Just click around!",
    "productivity": "You've been very productive today! Keep it up!",
    "coffee": "Time for a coffee break? I'll keep an eye on things.",
    "weekend": "Working on a weekend? Now that's dedication!",
    
    # === WINDOW-SPECIFIC PHRASES ===
    "pinball": "Oh, Pinball! Did you know my high score is 1,234,000?",
    "paint": "Drawing something for the portfolio? I can help you with shapes!",
    "minesweeper": "Don't click the mines! (I've been there...)",
    "search": "Rover is a good boy, isn't he?",
    "ie": "Looking for more projects? Check the favorites sidebar!",
    "notepad": "Writing something important? Don't forget to save!",
    "photos": "Nice photos! You have a great eye for composition.",
    "cmd": "Ooh, the command prompt! You must be a power user.",
    "winamp": "It really whips the llama's behind! Classic Winamp.",
    
    # === CAT PHRASES ===
    "cat_like": "Meow! The cat seems to like your portfolio.",
    "cat_recycle": "I think the cat is looking for the Recycle Bin.",
    "cat_step": "Watch out! Don't let him step on your windows.",
    "cat_treat": "Does anyone have a digital treat? This cat looks hungry.",
    "cat_sleep": "Shhh! The cat is taking a nap on your desktop.",
    "cat_knock": "Oh no! The cat knocked over a window! Classic cat behavior.",
    "cat_keyboard": "The cat is trying to type! I wonder what it's writing.",
    
    # === ROVER PHRASES ===
    "rover_star": "Did you know Rover used to be a movie star? He's very famous in the Windows XP world.",
    "rover_goodboy": "Who's a good search companion? Rover is! Yes he is!",
    "rover_fetch": "Rover tried to fetch your files, but he got distracted by a squirrel.",
    
    # === EXTRA PHRASES ===
    "cluttered": "Your desktop is looking a bit cluttered. Let me help you with that!",
    "updates": "New updates are available for your computer. Check the Control Panel!",
    "meme_secret": "I found some secret memes in the recycle bin. Don't tell Kenneth I told you!",
    "keyboard_shortcut": "Pro tip: Press Alt plus F4 to close windows quickly!",
    "easter_egg": "You found a secret! Kenneth hid easter eggs all over this portfolio.",
    
    # === THEME/CONTRAST PHRASES ===
    "hc_on": "Whoa! That's high contrast! Very retro.",
    "hc_off": "Back to the classic look!",
    "theme_success": "Applied the new color scheme! Looking good.",
    
    # === PHOTO VIEWER PHRASES ===
    "photo_nice": "What a beautiful photo! Kenneth has great taste.",
    "photo_next": "Let me show you the next masterpiece!",
    
    # === NOTEPAD PHRASES ===
    "notepad_save": "Your note has been saved! I'll remember it for you.",
    "notepad_tip": "Did you know? You can save notes and they'll still be here tomorrow!"
}

# The user specifically requested Brian Multilingual Neural
VOICE = "en-US-BrianMultilingualNeural"

async def generate_clippy_audio():
    output_dir = "sounds/clippy"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for key, text in phrases.items():
        output_path = os.path.join(output_dir, f"{key}.mp3")
        print(f"Generating: {output_path}...")
        # Brian sounds GREAT at normal rate/pitch as he is very expressive
        communicate = edge_tts.Communicate(text, VOICE) 
        await communicate.save(output_path)
    
    print("All audio files generated successfully with Brian!")

if __name__ == "__main__":
    asyncio.run(generate_clippy_audio())
