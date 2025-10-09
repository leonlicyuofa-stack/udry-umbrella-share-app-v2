package com.getcapacitor.myapp;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import com.getcapacitor.community.database.sqlite.SQLite.Utils.Record;
import com.getcapacitor.community.database.sqlite.SQLite.Utils.RecordDAO;

@Database(entities = {Record.class}, version = 1, exportSchema = false)
public abstract class RoomDatabase extends androidx.room.RoomDatabase {
    public abstract RecordDAO recordDAO();
    private static RoomDatabase INSTANCE;

    public static RoomDatabase getDatabase(final Context context) {
        if (INSTANCE == null) {
            synchronized (RoomDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                        context.getApplicationContext(),
                        RoomDatabase.class, "StorableDB"
                    ).build();
                }
            }
        }
        return INSTANCE;
    }
}
