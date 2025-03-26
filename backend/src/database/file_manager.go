package database

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// default directory should be "../data/"
type FileManager struct {
	DATAROOTDIR string
	// other state management stuff here if needed
}

// non-class specific
// if we are trying to request files that are not within the root data dir, then we should ignore request for security
func IsParent(parent, child string) (bool, error) {
	// Get absolute paths
	absParent, err := filepath.Abs(parent)
	if err != nil {
		return false, err
	}

	absChild, err := filepath.Abs(child)
	if err != nil {
		return false, err
	}

	// Clean paths for consistency
	absParent = filepath.Clean(absParent)
	absChild = filepath.Clean(absChild)

	// Check if absChild starts with absParent + path separator
	rel, err := filepath.Rel(absParent, absChild)
	if err != nil {
		return false, err
	}

	// If rel starts with ".." then the child is outside of the parent dir
	isParent := !strings.HasPrefix(rel, "..") && rel != "."

	return isParent, nil
}

func NewFileManager() *FileManager {
	return &FileManager{DATAROOTDIR: "../data/"}
}

func NewFileManagerPath(path string) *FileManager {
	return &FileManager{DATAROOTDIR: path}
}

func (fm FileManager) TestFunc() {
	fmt.Println("New FileManager initialized")
}

func (fm FileManager) CheckDataDirValid() {
	_, err := os.Stat(fm.DATAROOTDIR)
	if os.IsNotExist(err) {
		err := os.Mkdir(fm.DATAROOTDIR, 0755)
		if err != nil {
			return
		}
	}
	return

}

func (fm FileManager) CreateUserFolder(userName string) error {
	var dataDirReq = filepath.Join(fm.DATAROOTDIR, userName)

	_, err := os.Stat(dataDirReq)
	if os.IsNotExist(err) {
		// Directory does not exist, so create it
		err := os.Mkdir(dataDirReq, 0755)
		if err != nil {
			return err
		}
	}
	return err
}

func (fm FileManager) DeleteUserFolder(userName string) error {
	var dataDirReq = filepath.Join(fm.DATAROOTDIR, userName)
	var isInScope, err = IsParent(fm.DATAROOTDIR, dataDirReq)
	if isInScope { // good request, safe to delete folder
		err = os.RemoveAll(dataDirReq)
	}
	return err
}

func (fm FileManager) CreatePostFile(userName string, postId int, fileName string, data []byte) error {

	var file_name string = strconv.Itoa(postId) + "_" + fileName

	var dataDirReq = filepath.Join(fm.DATAROOTDIR, userName) // append path and user
	//dataDirReq = filepath.Join(dataDirReq, strconv.Itoa(postId)) // append postid folder
	dataDirReq = filepath.Join(dataDirReq, file_name) // add the file name to write to

	_, err := os.Stat(dataDirReq)
	if os.IsNotExist(err) {
		err = os.WriteFile(dataDirReq, data, 0644)
	} else {
		// clear content of original file and overwrite it
		err = os.Truncate(dataDirReq, 0)
		if err == nil {
			err = os.WriteFile(dataDirReq, data, 0644)
		}
	}
	return err
}

func (fm FileManager) GetPostFile(userName string, postId int, fileName string) ([]byte, error) {
	var file_name string = strconv.Itoa(postId) + "_" + fileName

	var dataDirReq = filepath.Join(fm.DATAROOTDIR, userName) // append path and user
	//dataDirReq = filepath.Join(dataDirReq, strconv.Itoa(postId)) // append postid folder
	dataDirReq = filepath.Join(dataDirReq, file_name) // add the file name to write to

	_, err := os.Stat(dataDirReq)
	if os.IsExist(err) {
		return os.ReadFile(dataDirReq)
	}
	return nil, err
}

func (fm FileManager) DeletePostFile(userName string, postId int, fileName string) error {
	var file_name string = strconv.Itoa(postId) + "_" + fileName

	var dataDirReq = filepath.Join(fm.DATAROOTDIR, userName) // append path and user
	//dataDirReq = filepath.Join(dataDirReq, strconv.Itoa(postId)) // append postid folder
	dataDirReq = filepath.Join(dataDirReq, file_name) // add the file name to write to

	var isInScope, err = IsParent(fm.DATAROOTDIR, dataDirReq)
	if isInScope { // good request, safe to delete folder
		err = os.Remove(dataDirReq)
		//err = os.RemoveAll(dataDirReq)
	}
	return err
}
