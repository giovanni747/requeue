# Database Schema Update Guide

## 🎯 **Required Changes**

You need to add two columns to your `rooms` table to support image uploads:

1. `image_url` - Stores the Cloudinary secure URL
2. `image_public_id` - Stores the Cloudinary public ID for future operations

## 📋 **Step-by-Step Instructions**

### **Option 1: Using SQL Script (Recommended)**

1. **Run the migration script:**
   ```bash
   # If using psql
   psql -d your_database_name -f database_migration.sql
   
   # If using a database client, copy and paste the contents of database_migration.sql
   ```

2. **Verify the changes:**
   The script includes a verification query that will show you the new columns.

### **Option 2: Manual SQL Commands**

If you prefer to run the commands manually:

```sql
-- Add image_url column
ALTER TABLE rooms ADD COLUMN image_url TEXT;

-- Add image_public_id column  
ALTER TABLE rooms ADD COLUMN image_public_id TEXT;

-- Optional: Add documentation
COMMENT ON COLUMN rooms.image_url IS 'Cloudinary secure URL for the room image';
COMMENT ON COLUMN rooms.image_public_id IS 'Cloudinary public ID for the room image';
```

### **Option 3: Using Database Client**

If you're using a database client like pgAdmin, DBeaver, or similar:

1. Connect to your database
2. Open the SQL editor
3. Run the commands from `database_migration.sql`
4. Execute the script

## 🔍 **Verification**

After running the migration, verify the changes with this query:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rooms' 
AND column_name IN ('image_url', 'image_public_id');
```

**Expected result:**
```
column_name      | data_type | is_nullable
image_url        | text      | YES
image_public_id  | text      | YES
```

## 🚨 **Important Notes**

### **Before Running:**
- ✅ **Backup your database** before making schema changes
- ✅ **Test on a development database** first if possible
- ✅ **Ensure no active connections** are writing to the rooms table

### **Column Details:**
- **`image_url`**: Stores the full Cloudinary URL (e.g., `https://res.cloudinary.com/...`)
- **`image_public_id`**: Stores the Cloudinary public ID (e.g., `rooms/room_123_image`)
- **Both columns are nullable** - rooms can exist without images
- **TEXT type** - Can store URLs of any reasonable length

### **Data Safety:**
- ✅ **No data loss** - Adding nullable columns is safe
- ✅ **Existing rooms** will have NULL values for these columns
- ✅ **Backward compatible** - existing code will continue to work

## 🔄 **Rollback (If Needed)**

If you need to remove these columns later, use the rollback script:

```bash
psql -d your_database_name -f database_rollback.sql
```

Or manually:
```sql
ALTER TABLE rooms DROP COLUMN IF EXISTS image_url;
ALTER TABLE rooms DROP COLUMN IF EXISTS image_public_id;
```

## 🧪 **Testing the Changes**

After updating the schema, test that the image upload functionality works:

1. **Create a new room** with an image
2. **Check the database** to see if the columns are populated:
   ```sql
   SELECT id, name, image_url, image_public_id FROM rooms ORDER BY created_at DESC LIMIT 5;
   ```
3. **Edit an existing room's image** through the settings
4. **Verify the update** worked correctly

## 🎯 **Next Steps**

After successfully updating the database schema:

1. ✅ **Set up Cloudinary** environment variables
2. ✅ **Test the upload functionality** 
3. ✅ **Verify images display** correctly in the UI
4. ✅ **Test room creation and editing** with images

## 🆘 **Troubleshooting**

### **Common Issues:**

**Error: "column already exists"**
- The columns may already be present
- Check with: `\d rooms` (in psql) or the verification query

**Error: "permission denied"**
- Ensure you have ALTER TABLE permissions
- Run as a database superuser if needed

**Error: "relation 'rooms' does not exist"**
- Check your table name - it might be different
- List tables with: `\dt` (in psql)

### **Need Help?**
If you encounter issues:
1. Check your database connection
2. Verify table name and permissions
3. Try running the commands one by one
4. Check the database logs for detailed error messages

---

**✅ Once completed, your room image upload system will be fully functional!**
