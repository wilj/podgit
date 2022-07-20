-- Possible domain name
-- Dmmigration.com
-- Edocsmigration.com
-- Edocsteam.com
-- Edocsexport.com
-- Basic setup
-- Database Vendor
-- DIM dbvend as Integer
-- dbvend = mySQL.GetDBVendor()



-- Library general data
-- Version
SELECT VERSION FROM DOCSADM.DOCSPARMS

-- General item counts

-- Document count (Not file count)
SELECT COUNT(*) FROM DOCSADM.PROFILE

-- Document types count
SELECT COUNT(*) FROM DOCSADM.DOCUMENTTYPES

-- Count by application
SELECT a.APPLICATION, COUNT(DOCNUMBER) FROM DOCSADM.PROFILE p INNER JOIN DOCSADM.APPS a ON a.DISABLED = 'N' WHERE p.APPLICATION = a.SYSTEM_ID GROUP BY a.APPLICATION ORDER BY a.APPLICATION

-- Count of folder profiles
SELECT  COUNT(*)
FROM  DOCSADM.PROFILE G_T0
WHERE G_T0.APPLICATION = 2

-- Documents created in the past week, month, year
        If dbvend = 3 Then
            sqlitem = "SELECT COUNT(p.docnumber)FROM DOCSADM.PROFILE p WHERE cast( p.creation_date as DATETIME) > cast(DATEADD(year,-1, getdate()) as DATETIME)"
            sqlitem2 = "SELECT COUNT(p.docnumber)FROM DOCSADM.PROFILE p WHERE cast( p.creation_date as DATETIME) > cast(DATEADD(month,-1, getdate()) as DATETIME)"
            sqlitem3 = "SELECT COUNT(p.docnumber)FROM DOCSADM.PROFILE p WHERE cast( p.creation_date as DATETIME) > cast(DATEADD(week,-1, getdate()) as DATETIME)"

        Else
            sqlitem = "SELECT COUNT(p.docnumber)FROM DOCSADM.PROFILE p WHERE cast( p.creation_date as DATE) > add_months(sysdate, -12)"
            sqlitem2 = "SELECT COUNT(p.docnumber)FROM DOCSADM.PROFILE p WHERE cast( p.creation_date as DATE) > add_months(sysdate, -1)"
            sqlitem3 = "SELECT COUNT(p.docnumber)FROM DOCSADM.PROFILE p WHERE cast( p.creation_date as DATE) > sysdate -7"

-- Groups with user counts
SELECT g.GROUP_ID, COUNT(p.USER_ID) FROM DOCSADM.GROUPS g, DOCSADM.PEOPLE p WHERE p.PRIMARY_GROUP = g.SYSTEM_ID GROUP BY g.GROUP_ID


-- Getting lookup data
-- Custom objects from Docscolumns table
SELECT  G_T0.COLNAME ,
G_T0.FCOLNAME ,
G_T0.FORMAT ,
G_T0.FTBNAME ,
G_T0.OBJECTTYPE ,
G_T0.PROMPT ,
G_T0.MULTI_VALUE ,
G_T0.OBJECTITEMS
FROM  DOCSADM.DOCSCOLUMN G_T0
WHERE G_T0.TBNAME = 'PROFILE'   AND G_T0.USER_ADDED = 'Y'    OR G_T0.OBJECTTYPE = 'BUFFER'   AND G_T0.USER_ADDED IS NULL

-- For each type
-- BUFFER - Is link to lookup table.

-- To get properties of Lookup links
SELECT  G_T1.G_F1 ,
G_T1.G_F2 ,
G_T1.G_F4 ,
G_T1.G_F6 ,
G_T1.G_F8 ,
G_T1.G_F7 ,
G_T1.G_F5 ,
G_T1.G_F3 ,
G_T0.COLNAME ,
G_T0.CREATOR ,
G_T0.ENCRYPT ,
G_T0.FCOLNAME ,
G_T0.FCREATOR ,
G_T0.FORMAT ,
G_T0.FTBNAME ,
G_T0.HELPID ,
G_T0.CMSKEY ,
G_T0.KEYGROUP ,
G_T0.LOOKUP ,
G_T0.OBJECTTYPE ,
G_T0.PROMPT ,
G_T0.TBNAME ,
G_T0.PROTECTED ,
G_T0.VALIDATION ,
G_T0.SYSTEM_ID ,
G_T0.VISIBLEINLIST ,
G_T0.OBJECTITEMS ,
G_T0.USER_MODIFIABLE ,
G_T0.USER_ADDED ,
G_T0.FULLTEXT ,
G_T0.REQUIRED ,
G_T0.ALLUPPER ,
G_T0.CMSTYPE ,
G_T0.COL_LENGTH ,
G_T0.ALLOWNULLS ,
G_T0.MULTI_VALUE ,
G_T0.API_SECURITY ,
G_T0.UNICODE
FROM  DOCSADM.DOCSCOLUMN G_T0,
(SELECT  G_T2.COLNAME  AS G_F1,
G_T2.FCOLNAME  AS G_F2,
G_T2.FORMAT  AS G_F3,
G_T2.FTBNAME  AS G_F4,
G_T2.OBJECTTYPE  AS G_F5,
G_T2.PROMPT  AS G_F6,
G_T2.MULTI_VALUE  AS G_F7,
G_T2.OBJECTITEMS  AS G_F8
FROM  DOCSADM.DOCSCOLUMN G_T2
WHERE G_T2.TBNAME = 'PROFILE'   AND G_T2.USER_ADDED = 'Y'    OR G_T2.OBJECTTYPE = 'BUFFER'   AND G_T2.USER_ADDED IS NULL
) G_T1
WHERE ( G_T0.TBNAME = G_T1.G_F4 )
AND ( G_T0.TBNAME  NOT IN ('PEOPLE' ) )

-- ComboBox
-- Decode FORMAT field

-- Edit
-- This a text field

-- Folder information
-- Documents within folders ----
SELECT  G_T0.DOCNAME ,
G_T1.PARENT ,
G_T1.DOCNUMBER ,
G_T0.REFERANCE_NUM
FROM  DOCSADM.PROFILE G_T0,
DOCSADM.FOLDER_ITEM G_T1
WHERE ( G_T0.DOCNUMBER = G_T1.DOCNUMBER )
AND ( G_T0.APPLICATION > 2 )

-- *** Then get parent of folder from Folder Items table using
-- Note: as long as parent is > 0 there is a parent folder level – Have max interations, incase folders loop of folders was created.  Or check to see if folder has already been used in currently folder structure
SELECT  G_T0.DOCNUMBER ,
G_T0.PARENT ,
G_T1.DOCNAME
FROM  DOCSADM.FOLDER_ITEM G_T0,
DOCSADM.PROFILE G_T1
WHERE G_T0.PARENT = G_T1.DOCNUMBER
