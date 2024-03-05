import pytest
from selenium import webdriver


@pytest.fixture
def driver():
    driver = webdriver.Chrome()
    #driver = webdriver.Chrome(executable_path="C:\\path\\to\\chromedriver.exe")
    #driver = webdriver.Chrome(ChromeDriverManager().install())
    yield driver
    driver.quit()